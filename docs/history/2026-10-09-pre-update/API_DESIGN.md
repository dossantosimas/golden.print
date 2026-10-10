# Contratos de aplicación y API — Golden Print 3D

Fecha: 2026-10-02 · Autor: atlas · Propuesta para implementación posterior a aprobación. Audiencia: frontend/backend/QA. No existen endpoints implementados.

## Transporte y convenciones

Server Components llaman queries server-only; formularios llaman Server Actions delgadas que invocan comandos reutilizables. Las operaciones de esta tabla son interfaces de aplicación, no una promesa de API REST pública. Route Handlers reales previstos: `/api/auth/[...all]` (Better Auth) y `GET /api/quotes/{quoteId}/revisions/{revisionId}/pdf` (descarga privada Node). No duplicar cada Server Action como REST; futuras integraciones consumirán el mismo servicio vía handler autorizado.

IDs UUID; `version` entero positivo; instantes ISO UTC y fechas efectivas `YYYY-MM-DD` interpretadas en America/Bogota. Dinero, cantidades, factores, porcentajes y segundos se serializan como strings decimales sin formato local. Integer COP en pagos/gastos; null representa cociente sin base. orgId/actorId/role nunca son autoridad aportada por cliente. Reject campos desconocidos y enums inválidos. Separar field errors Zod de fallos de dominio.

MutationContext: sesión verificada, empresa singleton, actor membership activa, requestId. Comandos reciben expectedVersion en edición y `idempotencyKey` UUID para creación repetible. Normalizar y hash payload; misma key/actor/operación/payload devuelve resultado previo tras reautorizar, otra entrada devuelve IDEMPOTENCY_CONFLICT. Persistir claves en payment o mutation_request según ARCHITECTURE; no depender de memoria serverless. GET/queries no mutan.

Result serializable: `{ ok: true, data, requestId }` o `{ ok: false, error: { code, message, fieldErrors?, currentVersion?, retryable }, requestId }`. No incluir stack trace/SQL/secrets. HTTP handler mapea errores; Server Actions conservan códigos. Respuesta DTO aplica permiso de campo; no enviar detalle restringido aunque la UI no lo muestre.

| Código estable | HTTP | Condición y recuperación |
|---|---:|---|
| VALIDATION_ERROR | 422 | Campo inválido; conservar formulario y mostrar fieldErrors |
| UNAUTHENTICATED | 401 | Sesión ausente/expirada; acceso nuevo |
| FORBIDDEN | 403 | Rol sin permiso; sin detalles financieros |
| NOT_FOUND | 404 | ID inexistente o ajeno a empresa; misma respuesta |
| VERSION_CONFLICT | 409 | Recargar currentVersion y resolver cambios |
| INVALID_TRANSITION | 409 | Estado no admite comando |
| PAYMENT_EXCEEDS_BALANCE | 409 | Saldo insuficiente tras lock; saldo disponible solo a administrador |
| IDEMPOTENCY_CONFLICT | 409 | Key usada con distinto payload |
| DEPENDENCY_CONFLICT | 409 | Archivo/borrado bloqueado por evidencia o relación |
| LAST_ADMIN_REQUIRED | 409 | Desactivar/degradar último administrador |
| RATE_LIMITED | 429 | Reintentar después de intervalo indicado |
| SERVICE_UNAVAILABLE | 503 | DB/auth/PDF no disponible; retryable, misma key en mutación |
| INTERNAL_ERROR | 500 | Falla no prevista; requestId para soporte |

ListQuery: q máx. 100 caracteres, cursor opaco validado, limit default 25/max 100, filtros enum y sort allowlist. Orden estable incluye id como desempate; cursores atados al filtro/sort. ListResult contiene items,nextCursor y total opcional. No concatenar sort SQL desde cliente. Filtros de períodos comparten normalizador financiero: [inicio local, día siguiente al fin) UTC. Sin rango futuro como corte; validar start<=end. Devolver period,basis,cutoff,temporalMode=current_restated y provisional cuando corresponda.

## DTOs principales

QuoteInput: projectName, customerId?, description?, printSeconds, materials[{filamentId,grams,pricePerGram?}], postprocess[{description,category,amount}], formula{powerKw,energyRate,machineRate,contingencyRate,multipliers}, selectedLevel?,manualPrice?,businessDate,validUntil?,customerNotes?,internalNotes?. Todos los totales calculados son outputs; rechazar o ignorar explícitamente totales cliente, nunca persistirlos como autoridad. Valores editables se resuelven a snapshot; no guardar referencia viva a settings. Publicación necesita precio seleccionado e información suficiente para PDF; customer opcional para cotizar, obligatorio para pedido.

QuoteResult: quoteId,revisionId,revisionNumber,status,version,code,formulaVersion,inputSnapshot,components,priceOptions,selectedPrice,estimatedProfit,marginPercent,createdAt. Operador tiene desglose estimado; PDF comercial no lo incluye. Settings solo fuente de defaults para entradas nuevas.

OrderResult: id,code,customer,sourceQuoteId?,acceptedRevisionId?,quotationBadge,status,orderDate,confirmedAt?,deliveredAt?,agreedPrice?,estimatedCost?,actualCost,costCompleteness,receivedAmount,balance,paymentStatus,version. Operador puede ver resumen saldo/badge, pero nunca paymentDetails/cashMovement ni resultados globales. Pedido provisional: agreedPrice=null, no paga ni produce antes de confirmación.

PaymentInput: orderId,paymentDate,amount,method?,reference?,notes?,idempotencyKey. CostInput: orderId,attemptId?,category,economicClassification(variable/nonvariable),cashNature(monetary/nonmonetary),description,incurredDate,amount,quantity?,unitCost?,filamentId?,cashOut?{date,amount,reference}. `cashOut` solo administrator; operador registra costo sin desembolso, administrador puede agregarlo después. Compra ya pagada/consumo no admite egreso repetido. ExpenseInput: expenseDate,description,classification(opex/material_purchase),costBehavior(fixed/variable, obligatorio solo OPEX),category,amount,responsibleUserId,notes?. LossInput: recognizedDate,category,description,amount,originReference?,cashOut?; no admite costo duplicado de un pedido.

Límites numéricos de validación deben corresponder a numeric(18,6)/(18,0)/(12,6), bigint y límites de payload: precisión decimal de cálculo 80 dígitos y guardia de overflow antes de persistir. Duración h/m/s UI se convierte sin floats a segundos, minutos/segundos 0–59. Materiales/postprocesados máximo 100 líneas por documento, textos nombre 200, descripción/notas 5000, precio no negativo; no aceptar Infinity/NaN, notación no normalizada ni arrays ilimitados. Regla negocio exacta en FINANCIAL_RULES.

## Interfaces por módulo

A=administrator; O=operator. Autorización real en el servicio, incluida lectura y cada ID relacionado.

| Interfaz / comando | Rol | Entrada y resultado / integridad |
|---|---|---|
| customers.list/get/history | A,O | ListQuery/id; historial comercial y cantidad; cifras globales/ranking monetario solo A |
| customers.create/update/archive | A,O | nombre/contacto/opcionales; version en update/archive; archivo conserva FKs/historial |
| customers.deleteUnused | A,O | id/version; solo sin cotizaciones/pedidos, dependencias devuelven conflicto |
| filaments.list/get | A,O | catálogo vigente/archivado según filtro |
| filaments.create/update/archive/deleteUnused | A,O | precio rollo,peso positivo; costo/gramo recalculado; no compra/caja automática |
| settings.getDefaults | A,O | parámetros de cotizador; sin secretos ni administración |
| settings.update | A | expectedVersion y fórmula válida; audit; no altera snapshots |
| quotes.calculatePreview | A,O | QuoteInput; función pura local + mismo servicio servidor al guardar |
| quotes.createDraft/updateDraft | A,O | input + key/version; recalcular servidor; código COT transaccional |
| quotes.list/get/getRevision | A,O | filtros/ids; revisiones históricas con permisos |
| quotes.revise | A,O | quoteId,sourceRevisionId,version,key,input; nueva revisión draft; no sobrescribir publicada |
| quotes.publish | A,O | id/revision/version/key; recalcular/freezar y pasar sent; PDF después de commit |
| quotes.accept/reject | A,O | revisionId/version/key,reason si rechazo; sent→accepted/rejected, evento |
| quotes.duplicate | A,O | sourceRevisionId,key; quote/draft nuevo sin aceptación/pedido |
| quotes.archive/deleteUnusedDraft | A,O | version; no borrar publicadas ni fuente de pedido |
| orders.createIntake | A,O | customerId,title,orderDate,notes,key; provisional not_started sin precio |
| orders.convertQuote | A,O | quoteId,acceptedRevisionId,customerId,existingIntakeId?,key; lock quote, confirma intake o crea pedido; devolución del existente si ya convertido |
| orders.list/get/updateMetadata | A,O | filtros/id; metadata expectedVersion; no edición directa precio confirmado |
| orders.transition | A,O | id/version,target,reason?; reglas de estados y entrega; lock/audit |
| orders.archive/deleteUnusedIntake | A,O | version; provisional sin pagos/intentos; pedido confirmado se conserva |
| production.startAttempt/reprint | A,O | orderId/version/key; confirmado, un intento activo; reprint desde damaged, nuevo número |
| production.completeAttempt/failAttempt | A,O | attemptId/orderVersion/key,actualSeconds,costs?,reason fallo,completeness; estado y costos atómicos |
| production.addCost/correctCost | A,O | CostInput/key o costId/version/reason; si caja asociada requiere A; audit, sin borrar evidencia |
| production.setCostCompleteness | A,O | orderId/version,complete/incomplete,motivo; cierre explícito, no ceros automáticos |
| production.recordDirectCashOut | A | costId,date,amount,key; pago efectivo positivo, saldo desembolsable y origen exclusivo |
| cash.correctDirectOut | A | movementId,sourceId,expectedVersion,reason,replacement?{date,amount,reference},key; solo egreso de direct_cost o independent_loss; lock origen→movement, anular original y crear reemplazo positivo si corresponde, validar suma egresos ≤ costo/pérdida vigente y guardar auditoría/resultado en una transaction |
| payments.list/create/settleBalance | A | pedido/fecha/valor/key; settle registra saldo restante real; lock order, ledger+movimiento+audit |
| payments.correct | A | paymentId,reason,replacement?{fecha,valor},key; void y reemplazo auditado, validación de saldo en una transaction |
| expenses.list/get/create/update/void | A | ExpenseInput/key o id/version/reason; ajuste atómico movimiento, evidencia original |
| losses.list/create/correct | A | LossInput/key o id/version/reason; independiente, no repetir direct_cost; caja solo si pagado |
| reporting.operationalDashboard | A,O | filtros; conteos y pendientes; O sin DTO financiero agregado |
| reporting.financeDashboard/customerMoneyRanking/cash | A | period; métricas/cohorte/caja/provisional conforme fuente única |
| users.list/create/changeRole/deactivate/reactivate/resetCredential | A | targetUserId/version/key; pertenencia, lock último admin; revocar sesiones, no secretos en respuestas |
| access.changeOwnPassword | A,O | credencial vigente/contraseña nueva; Better Auth; revocación de otras sesiones según política |
| audit.list | A | entity/filter/cursor; sin secretos, datos limitados |

Correcciones retroactivas admin requieren motivo y reexpresan reportes históricos por fecha efectiva; operadores solo corrigen costos sin caja en período operativo antes de entrega. Corrección de costos de pedido entregado requiere A. Contrato exacto de update/correctCost preserva original mediante evento/correction_of en datos; no transformar anulación técnica en devolución.

Correcciones de costo/pérdida anulan original y crean reemplazo en la misma transacción; toda suma excluye `voided_at` actuales. Si hay caja asociada: solo A, no reducir importe económico por debajo de egresos válidos asociados; devolver DEPENDENCY_CONFLICT y exigir corregir primero el egreso erróneo con motivo. Migrar referencia de movimientos válidos al costo reemplazo con auditoría, sin generar otro egreso ni devolución. Fecha/importe de movimientos solo cambian por corrección técnica explícita auditada del registro real, no por corregir estimados o por fallo de impresión.

`cash.correctDirectOut` es la recuperación disponible para un desembolso directo registrado por error antes de corregir su costo/pérdida. Verificar fuente del mismo negocio, permiso admin, versión/key y motivo. Original y reemplazo conservan cadena correction_of_id; excluir original anulado en caja. Sin replacement se anula solamente el registro falso con confirmación explícita; con replacement se conserva la fecha/importe reales corregidos. No ejecuta transferencias, reintegros ni pagos negativos; no permite borrar un desembolso real para ajustar rentabilidad. UX muestra antes/después y que es una corrección del registro, no devolución.

Notas y PDF: QuoteInput.customerNotes → quote_revision.customer_notes; internalNotes → internal_notes. El handler construye DTO comercial allowlist con marca, código/revisión, cliente («Sin cliente» si ausente), proyecto/descripción, precio seleccionado, fecha/validez y customer_notes. No pasar QuoteResult completo al renderer; excluir internal_notes, inputs de fórmula, componentes, ganancias y costos reales. Esto también aplica al preview de borrador.

Dashboard operativo: filtrar orderDate en período y contar por estado actual; devolver basis=order_date_current_status. No representa el estado histórico al corte. Finanzas conserva delivered_at/paymentDate y current_restated según fuente financiera.

## Ciclos y transacciones

Cotización: draft→sent→accepted/rejected. Editar sent/rejected crea draft nuevo y conserva anterior; accepted con pedido no se revisa comercialmente en MVP. Accepted sin pedido puede convertirse; no aceptar una revisión nueva que eluda la unicidad del pedido de quote. Duplicar crea nueva quote con referencia fuente. PDF está disponible para revisión enviada/aceptada/rechazada; preview de draft se etiqueta «Borrador» y no publica.

Pedido provisional solo admite metadata/quote linkage. Confirmado not_started→printing por startAttempt; printing→finished al éxito o damaged al fallo; damaged→printing con reprint; finished→delivered mediante transición explícita. Entrega con costos incompletos pide reconocimiento explícito y mantiene indicadores provisionales. Reapertura de delivered solo A, motivo y evento; deshace delivered_at para reportes actuales restatados, no reabre revisión contractual. No introducir estado cancelado no solicitado; archive preserva evidencia y no elimina saldos, métricas ni ledger. Pedidos con pagos no se borran/cancelan. PagoStatus es derivado, jamás editable.

Conversión: quote lock → validar accepted/source y cliente → lock intake si procede → counter → crear/enlazar order+snapshot de precio+audit → commit. UNIQUE source_quote_id y accepted_revision_id son respaldo. Distinta revisión concurrente no crea otro pedido. Si aceptación y conversión se presentan como una acción de UI, servicio `acceptAndConvert` hace ambas en la misma transaction.

Abono: lookup key → lock order → saldo desde payments válidos → validar confirmed y amount<=saldo → payment+movement+audit+key → commit. Sobrepago nunca pasa por validación UI solamente. Corrección realiza void/replacement del payment y su movimiento fuente en la misma transaction; informes usan datos válidos actuales y auditoría conserva original.

## HTTP específicos y auth

Better Auth handler usa schema/plugin de versión pinneada. No reconstruir API de auth manualmente. Signup público off, rutas admin directas deben aplicar guardia de negocio para prevenir saltarse último-admin/membership; deshabilitar impersonación. No exponer secretos de bootstrap; CLI privado no es endpoint. Alta retorna userId/membership/status, nunca hash ni contraseña inicial. Al fallar segunda etapa de alta devuelve failure sin membership y exige reparación asistida; no crea autoridad parcial.

PDF GET exige sesión y permiso quote read, IDs de la misma empresa/quote, revisión permitida; 200 application/pdf con Content-Disposition attachment y nombre saneado, Cache-Control private,no-store. Generar desde snapshot y datos públicos; sin fetch externo, costo/margen/observaciones internas. 404 para combinación inválida; 503 para generación fallida y requestId. Límite de tamaño/tiempo del handler validado en smoke de runtime tras scaffold. No respuesta PDF parcial ni marcar sent automáticamente al descargar.

## Verificación planificada

Unitarias financieras comparten ejemplos de FINANCIAL_RULES; integración SQL real verifica idempotencia/colisiones/rollback/FKs; tests de autorización prueban cada operación A/O y campos DTO; E2E cotiza→convierte→abonos→falla→reimprime→entrega; PDF verifica nombres largos, español y varias páginas. Versiones/autorización/errores se prueban por llamadas directas al servicio y HTTP donde existe; no basta ocultar botones. Ninguna prueba está ejecutada en esta fase.

