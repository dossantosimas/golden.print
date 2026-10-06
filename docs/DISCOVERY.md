# Discovery — Golden Print 3D

Versión: 0.2 · Fecha: 2026-10-02 · Estado: discovery con respuestas completas; borrador para integración, no aprobado.
Autor: scribe. Revisor: Project Orchestrator; reglas propuestas de blueprint por revisar y aprobar.
Audiencia: propietario y equipos de producto, finanzas, arquitectura, UX y QA.
Relacionado: [PROJECT_BRIEF.md](PROJECT_BRIEF.md).

## Evidencia y límites

Fuente primaria: `C:/Users/dossa/.codex/attachments/c731f94f-93f1-481e-b994-1e6bcd1df15b/Texto pegado.txt`.
Se leyeron `codex-framework/framework/AGENTS.md`, `docs/INVENTORY.md`, `agents/product/scribe/SKILL.md` y las referencias locales `prd-template.md`, `anti-patterns.md` y `document-types.md`.
Las referencias §1–§24 remiten directamente a la fuente inicial. REQUIREMENTS y ledger añaden IDs canónicos con contratos ya restaurados.
El inventario conserva la fuente inicial; respuestas posteriores actualizan su autoridad. No sustituye la integración y aprobación final del blueprint.

## Inventario factual por sección

### §1 — Autenticación

Registro, inicio y cierre de sesión, sesiones persistentes y rutas protegidas.
Better Auth es obligatorio; su integración con la base de datos se decidirá durante arquitectura.
Confirmado posteriormente: uso exclusivo del negocio, primer usuario administra usuarios. Propuesta: bootstrap único atómico y perfiles propietario/admin y operador; no registro público irrestricto.

### §2 — Dashboard

Tarjetas: total de pedidos, no iniciados, imprimiendo, terminados, entregados, dañados, valor total vendido, recaudo real, saldo pendiente y utilidad.
Gráfico de distribución: No iniciado, Imprimiendo, Terminado, Entregado y Dañado. El tipo de gráfico se elegirá por UX.
Debe facilitar identificar pendientes, producción, terminados, cartera y rentabilidad.

### §3 — Pedidos

Alternar TABLE VIEW y CARD VIEW. Campos mínimos: ID, nombre/proyecto, cliente, cotización relacionada, estado de cotización, estado de pedido, estado de pago, fechas de pedido/entrega, observaciones, costo de producción, precio cobrado, margen en valor y porcentaje.
Estados de cotización: Falta por cotizar, Cotización enviada, Aceptada y Rechazada.
Estados de pedido: No iniciado, Imprimiendo, Terminado, Entregado y Dañado.
Estados de pago: Pendiente de pago y Pagado.
Semáforo/badges. Crear, modificar, consultar, eliminar cuando las reglas permitan, cambiar estados, buscar, filtrar y ordenar.
Relacionar pedidos y cotizaciones; convertir aceptadas sin duplicar información innecesariamente.
Reglas de eliminación y transiciones se definirán en blueprint.

### §4 — Clientes

Agregar, modificar, consultar y eliminar cuando sea posible. Datos mínimos: nombre y número de contacto.
Evaluar email, Instagram/red social, notas y dirección durante discovery; no son campos mínimos confirmados.
Mostrar último pedido, cantidad total, ventas acumuladas y saldo pendiente si aplica.
Ranking por cantidad de pedidos y valor vendido; historial por cliente.

### §5 — Finanzas

Mostrar ventas totales, costos de producción, margen bruto en valor/porcentaje, recaudo real/tasa de cobro, saldo/porcentaje por cobrar, pérdidas, OPEX y utilidad neta.
Pérdidas posibles: impresión dañada, material perdido, trabajos no cobrados y otros costos atribuibles.
Definir fórmula de utilidad neta en blueprint.
Filtros: última semana, último mes, últimos 3 meses, año actual, histórico completo y rango personalizado.
Gráficas de evolución financiera; termómetro/indicador de progreso del punto de equilibrio del período, con cálculo definido por producto/finanzas.
Mostrar entradas de caja, salidas de caja, flujo neto y estructura de OPEX por categoría.

### §6 — Gastos

Agregar, modificar, eliminar y consultar. Datos sugeridos: fecha, descripción, categoría, valor, responsable y observaciones; validar otros campos durante discovery.
Filtros: última semana, último mes, últimos 3 meses, año actual, histórico completo y rango personalizado.
Gastos por categoría, egresos en el tiempo, gastos por responsable y tabla detallada.
Los gastos alimentarán automáticamente finanzas.

### §7 — Filamentos

Administrar marca, modelo, material/tipo, color, valor comprado, peso del rollo y valor por gramo.
Calcular costo por gramo automáticamente cuando existan los datos necesarios.
Evaluar gramos restantes, inventario, proveedor, fecha de compra, diámetro y ubicación para etapas posteriores.
No incorporarlos al MVP automáticamente si introducen complejidad innecesaria.

### §8 — Cotizador

Proyecto: nombre/figura/proyecto, cliente opcional y descripción.
Múltiples materiales; por línea: filamento/material, gramos utilizados, costo por gramo y costo calculado.
Agregar y eliminar materiales dinámicamente.
Tiempo en horas y minutos, convertido internamente a tiempo total; tarifa máquina/hora y costo automático.
Uno o varios costos flexibles de postprocesado: lijado, pintura, pegado, resina, armado, acabado y otros.
Factor de riesgo/tasa de fallo con fórmula explícita en blueprint; no inventarla silenciosamente.

### §9 — Costo estimado

Costo de materiales + costo de máquina + postprocesado + factor esperado de riesgo/fallo = costo estimado de producción.
Respuesta posterior define contingencia=M*0.10, solo material; se añade energía y PP antes de multiplicar.

### §10 — Niveles de precio

Histórico de fuente inicial: porcentajes 20%, 50% y 100%. Reemplazados por instrucción posterior: multiplicadores editables 2, 2.5 y 3.
Cada opción muestra costo, margen %, margen en dinero y precio final.
Definir si representan markup sobre costo o margen sobre venta; explicar la fórmula y no mezclar conceptos.
Nombres conceptuales Oferta 1/2/3; el nombre de cada nivel debería poder configurarse posteriormente.

### §11 — Gestión de cotizaciones

Guardar, editar, duplicar, consultar, marcar enviada, aceptar, rechazar y convertir a pedido; mantener historial.
Identificador de cotización y pedido diferentes. `COT-0001` y `PED-0001` son ejemplos.
Determinar un mecanismo sin colisiones; no se decidió formato definitivo.

### §12 — PDF

Descargar cotización adecuada para enviar a cliente.
Contenido mínimo: Golden Print 3D, número, cliente, proyecto, descripción, precio seleccionado, fecha, validez si aplica y notas.
Estructura profesional sencilla definida con UX/branding.
Diferenciar costos internos y documento del cliente; no es necesario revelar todo el desglose interno.

### §13 — Cotización a pedido

Flujo conceptual: cliente → cotización → cotización aceptada → pedido → producción → entrega → pago.
Generar pedido desde cotización aceptada reutilizando datos pertinentes y manteniendo trazabilidad.
Confirmado posteriormente: anticipos y abonos con fecha/valor, sin devoluciones; cobro independiente de entrega.

### §14 — UX/UI

Administración eficiente; desktop y móvil.
Preferir modales, drawers cuando correspondan, desplegables, combobox, tablas claras, cards, badges, filtros, búsqueda, feedback y confirmación de acciones destructivas.
Evitar páginas innecesariamente complejas. Umbrales medibles de usabilidad/accesibilidad pendientes de definición técnica y validación.

### §15 — Tecnología

Preferencias requeridas expresadas: Next.js, TypeScript, Better Auth, Neon PostgreSQL y Vercel.
Evaluar shadcn/ui u otra alternativa, ORM, validación, formularios, gráficos, PDF, testing y estado si realmente hace falta.
Architecture/Technology justificará el resto; evitar librerías innecesarias.
No se tomaron decisiones de implementación en este intake.

### §16 — Base de datos

Estudiar entidades similares a User, Customer, Quote, QuoteItem/QuoteMaterial, Order, Filament, Expense, PostProcessingCost y Payment o PaymentStatus.
La lista no es modelo definitivo. Database Architect debe derivarlo de requisitos.
Mantener integridad entre clientes, cotizaciones, pedidos, materiales, costos, gastos y finanzas.

### §17 — Métricas

Documentar fórmulas de ventas totales, costo de producción, margen bruto en valor/porcentaje, recaudo real, tasa de cobro, saldo por cobrar, OPEX, pérdidas, utilidad neta, flujo de caja y punto de equilibrio.
Todas las pantallas usarán una fuente de verdad única para cálculos financieros.
Confirmado: COP, America/Bogota y sin impuestos. Bases temporales y reconocimiento se proponen en FINANCIAL_RULES para gate.

### §18 — Auditoría de cálculos

Validar cotizador, porcentajes, costo por gramo/hora, márgenes, recaudo, cartera, utilidad, pérdidas y equilibrio.
Crear tests para funciones financieras críticas.
Estos tests todavía no existen; esta fase no implementa funciones.

### §19 — MVP, NEXT y FUTURE

Clasificar funcionalidades durante blueprint. MVP debe cubrir operación real sin sobrecargar primera versión.
Conservar todos los requisitos de la visión y registrar lo aplazado en NEXT/FUTURE.
PRD propone todos los módulos en MVP y conserva NEXT/FUTURE para ampliaciones.

### §20 — Documentación

Mantener cuando aplique: PROJECT_BRIEF.md, REQUIREMENTS.md, PRD.md, TECHNOLOGY_STACK.md, ARCHITECTURE.md, DATABASE_DESIGN.md, API_DESIGN.md, UX_PLAN.md, FINANCIAL_RULES.md, IMPLEMENTATION_PLAN.md, TASKS.md, RISKS.md y PROJECT_STATUS.md dentro de docs/.
Crear ADRs para decisiones arquitectónicas relevantes.
La lista no implica que se hayan generado todos esos documentos.

### §21 — Discovery

Revisar toda la información antes del blueprint. No volver a preguntar hechos explícitos.
Preguntas con impacto en negocio, alcance, arquitectura, cálculos, permisos u operaciones; agrupar una sola ronda cuando sea posible.
Preguntar contradicciones e indicar requisitos insuficientemente definidos.

### §22 — Approval gate

Después del discovery generar blueprint y resumen: Project, Scope, MVP, Modules, Architecture, Technology Stack, Database overview, Financial model, Quotation model, Milestones y Risks.
Presentar `BLUEPRINT READY FOR REVIEW` y detenerse para Approve o Request changes.
No implementar antes de aprobación. Ese gate corresponde al orquestador tras integración y revisiones; todavía no se alcanzó.

### §23 — Continuación autorizada después de aprobar

TECHNOLOGY_FINALIZATION → ARCHITECTURE_VALIDATION → DATABASE DESIGN → IMPLEMENTATION PLANNING → TASK BREAKDOWN → SCAFFOLD → AUTHENTICATION → CORE MODULES → FINANCIAL CALCULATIONS → QUOTATION ENGINE → PDF → TESTING → SECURITY REVIEW → CODE REVIEW → BUILD VALIDATION → DOCUMENTATION → DELIVERY.
No pedir autorización fase por fase; respetar decisiones importantes del framework.
La autorización para implementación está condicionada a una aprobación futura del blueprint.

### §24 — Información adicional

Preguntar información crítica durante DISCOVERY; no asumirla.
Evitar un cuestionario interminable; priorizar cuestiones que cambien materialmente diseño o reglas de negocio.
Estado inicial solicitado: NEW PROJECT → DISCOVERY.

## Respuestas confirmadas de discovery — autoridad posterior

| Grupo inicial | Respuesta del propietario | Efecto |
|---|---|---|
| Acceso | Exclusiva para Golden Print 3D; primer usuario administra usuarios | Modelo de negocio único; bootstrap atómico propuesto; roles propuestos |
| Moneda/impuestos | COP, America/Bogota, sin impuestos | Configuración financiera única |
| Abonos/devoluciones | Anticipos y abonos con fecha/valor; sin devoluciones | Pagos individuales, estado derivado y caja por fecha |
| Costos/fallos | Costos reales sí; reimprimir para el mismo pedido | Acumular intentos sin duplicar pedido/venta |
| Precio/riesgo | Fórmula editable detallada abajo | Sustituye porcentajes y riesgo probabilístico iniciales |
| Aclaración final PP | Sumar postprocesado al costo antes de multiplicadores | Fórmula completa; sin pregunta pendiente |

No quedan preguntas bloqueantes de negocio. Las cinco preguntas iniciales y la aclaración PP fueron respondidas; no deben repetirse.
Responder discovery no implica aprobar el blueprint.

## Fórmula completa confirmada

```text
H = horas + minutos/60 + segundos/3600
M = SUM(gramos_i * precioGramo_i)
E = H * 0.15 * 1100
A = H * 2000
K = M * 0.10
PP = SUM(postprocesado)
C = M + E + A + K + PP
P1 = C * 2
P2 = C * 2.5
P3 = C * 3
```

Todas las variables indicadas son editables. Energía: kW * horas * COP/kWh; máquina: COP/h; contingencia: porcentaje solo del material.
Los precios corresponden a markup 100/150/200% y margen sobre venta 50/60/66.6667%; mostrar bases separadas.
PP no aumenta contingencia. La reserva del material no es probabilidad de falla ni una salida de caja real.
La respuesta posterior sustituye precios 20/50/100 y cualquier propuesta `1/(1-p)`; mantener fuente inicial como histórico, no regla vigente.
[FINANCIAL_RULES.md](FINANCIAL_RULES.md) define cálculos y precisión; REQUIREMENTS contiene casos verificables.

## Propuestas de blueprint, distintas de respuestas

- Roles propietario/admin y operador con mínimo privilegio; bootstrap único atómico.
- Snapshot de parámetros, conversión idempotente, eliminación conservadora, no sobrepagos y correcciones auditadas.
- Ventas reconocidas al entregar; compromiso comercial y caja separados.
- Recaudo por cohorte al corte para tasa de cobro, caja por fecha de movimiento y cartera global con base visible.
- Costos fallidos incluidos una sola vez en costo real; OPEX/compras/consumo separados.
- Utilidad neta V-C-O-L y equilibrio por contribución, con no estimable en casos sin base o costos incompletos.
- Metas de accesibilidad/rendimiento y milestones MVP/NEXT/FUTURE.

FINANCIAL_RULES §§7–9 es fuente de las propuestas financieras. La revisión del blueprint aprobará o ajustará esas reglas.
No son opiniones o políticas atribuidas al propietario. No se requiere nueva ronda de preguntas para decisiones técnicas rutinarias.

## Trazabilidad de las 24 secciones

| Fuente inicial | Requisitos canónicos |
|---|---|
| §1 | REQ-001–003; CFR-001 |
| §2 | REQ-004 |
| §3 | REQ-005–007, REQ-026–027 |
| §4 | REQ-008–009 |
| §5 | REQ-010–013, REQ-026–027 |
| §6 | REQ-011, REQ-014–015 |
| §7 | REQ-016, REQ-032 |
| §8 | REQ-017–021 |
| §9 | REQ-018–021 |
| §10 | REQ-022, REQ-032 |
| §11 | REQ-023–024 |
| §12 | REQ-025 |
| §13 | REQ-024, REQ-026 |
| §14 | REQ-029; CFR-002 |
| §15 | Constraints de REQUIREMENTS; arquitectura/stack por integrar |
| §16 | REQ-030 |
| §17 | REQ-010, REQ-031 |
| §18 | REQ-031; CFR-003–005 |
| §19 | REQ-032 |
| §20 | REQ-033 |
| §21 | REQ-034 |
| §22 | REQ-034 |
| §23 | REQ-035 |
| §24 | REQ-034 |

## Recursos del framework y estado reconstruido

Histórico v0.1: `scribe/_common` era archivo de 10 bytes `../_common`; HANDOFF/TRACEABILITY no accesibles, impidiendo specs formales.
Estado actual: orquestador informa restauración de 118 archivos byte a byte desde `_sources/agent-skills/_common`, hashes SHA256 coincidentes y fuente intacta.
Scribe verificó `PSIsContainer=True` y leyó OPERATIONAL, TRACEABILITY, contratos spine y workflows. El bloqueo anterior queda resuelto; no se repite como pendiente vigente.
PROJECT_STATUS leído antes de actuar conserva el intake anterior; su actualización pertenece al orquestador. No se modificó.
`git status` informa que el proyecto no es repositorio Git. No se inicializó Git ni se implementó código.
No se escribieron journals fuera de los cinco archivos autorizados; las decisiones necesarias para handoff quedan aquí y en los documentos permitidos.

## Calidad, evidencia y límites

Cobertura documental: 24 secciones conservadas; 35 REQ y 5 CFR con AC/SC canónicos; fuentes y cambios de autoridad trazados.
Reglas confirmadas: negocio, pagos, costos/fallos y fórmula completa con PP. Confianza alta por respuesta transmitida por orquestador.
Propuestas financieras, roles, metas no funcionales y alcance por fase: pendientes de revisión/aprobación del blueprint.
Tests e implementación: inexistentes; ledger NOT_TESTED con brechas de código declaradas. Revisión independiente documental completada posteriormente por orquestador/reviewers; evidencia en REVIEW_REPORT.md.
Discovery completo y blueprint integrado para aprobación, según BLUEPRINT.md y PROJECT_STATUS.md. No hay blueprint aprobado ni aplicación entregada; esperar gate del propietario.
Capacidades físicas ausentes del inventario no bloquean administración web; CAD/slicing/manufactura no forman parte de este alcance.

## Glosario

Markup: recargo sobre costo; margen sobre venta: diferencia dividida por precio.
Recaudo: cobros con fechas propias; cartera: saldo por pedido; OPEX: gasto operativo clasificado.
Costo estimado: fórmula de cotización; costo real: consumos de intentos ejecutados; contingencia: reserva material.
Incobrabilidad no es saldo pendiente automáticamente; castigos y trabajos no cobrados quedan conservados en NEXT con auditoría.

## Historial

| Fecha | Versión | Cambio |
|---|---|---|
| 2026-10-02 | 0.1 | Intake factual, cinco preguntas y defecto de recursos |
| 2026-10-02 | 0.2 | Respuestas completas, restauración informada y comprobada, fórmula PP confirmada y trazabilidad canónica |
