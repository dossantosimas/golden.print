> Estado de ejecución (2026-10-03): este documento conserva los escenarios del blueprint. La evidencia actual y los límites están en .traceability.yaml y VALIDATION_REPORT.md; las etiquetas originales pendientes describen la etapa de planificación.

> Regla vigente (2026-10-05, corrección del usuario): el costo del pedido se obtiene directamente del costo de producción de la revisión aceptada de la cotización, o de su ajuste explícito en el pedido. No se registra ni confirma otro costo real; la ganancia es precio acordado menos ese costo. Los registros anteriores de costos se conservan como historial y no se suman nuevamente. Los apartados históricos que exigen registro/completitud de costos quedan sustituidos por esta regla. El costo de producción no crea un movimiento de caja.

# Requirements — Golden Print 3D

Versión: 0.2 · Fecha: 2026-10-02 · Estado: borrador de blueprint para integración, no aprobado.
Autor: scribe. Revisión: Project Orchestrator, producto, arquitectura, QA y propietario (pendiente).
Audiencia: propietario, producto, finanzas, arquitectura, UX, desarrollo y QA.

## Autoridad, alcance y dependencias

Fuente inicial: las 24 secciones de `Texto pegado.txt` adjunto; respuestas posteriores del usuario integradas por el orquestador. Este documento define REQ/CFR/AC/SC; PRD y ledger derivan de él. Las fórmulas ejecutables finales se centralizarán en FINANCIAL_RULES.md y deben coincidir con la respuesta autoritativa.
MVP: aplicación interna de un solo negocio, todos los módulos administrativos solicitados. NEXT/FUTURE: inventario avanzado y ampliaciones registradas en PRD. Sin CAD, slicing, control de impresora, e-commerce público, multiempresa ni impuestos. Sin devoluciones en MVP.
No quedan preguntas de negocio bloqueantes: postprocesado se suma al costo antes de multiplicadores. Roles, campos opcionales, eliminación conservadora e idempotencia son propuestas explícitas de blueprint.
No hay aprobación ni código, tests o evidencia de funcionamiento. Criterios sujetos a revisión independiente y aprobación del propietario.

## Fórmula confirmada y cambios de autoridad

```text
H = horas + minutos/60 + segundos/3600
M = sum(gramos_i * precioGramo_i)
E = H * potencia_kW * tarifa_energia_COP_kWh    # iniciales: 0.15 y 1100
A = H * tarifa_maquina_COP_h                  # inicial: 2000
K = M * contingencia                         # inicial: 0.10
PP = sum(costos_postprocesado)
C_base = M + E + A + K
C = C_base + PP
P_n = C * multiplicador_n               # iniciales: 2, 2.5, 3
markup_% = (P_n-C)/C * 100
margen_venta_% = (P_n-C)/P_n * 100
```

Materiales y variables son editables. Los valores iniciales 20/50/100 del encargo quedan reemplazados por 2/2.5/3, por instrucción posterior. La contingencia material del 10% reemplaza la tasa de fallo como regla de estimación: no es probabilidad de reimpresión. El 100% sobre precio ya no es una opción inicial de margen.
Confirmado por respuesta final: postprocesado `PP` se suma antes de multiplicar: `C=C_base+PP`; cada oferta usa `C*m`.
Los márgenes iniciales incluyen PP dentro del costo: 50/60/66.6667% sobre venta y 100/150/200% sobre costo.
Redondeo y límites numéricos son propuesta técnica de FINANCIAL_RULES; pruebas deben usar aritmética decimal y declarar su regla. Los ejemplos aquí conservan valores antes de redondear.

## Functional Requirements y criterios BDD

### REQ-001 — Autenticación

Fuente: §1. Prioridad: CRITICAL; fase: MVP.
Registro autorizado, inicio/cierre de sesión y sesiones persistentes con Better Auth; todas las rutas administrativas protegidas.

**AC-AUTH-001** — parent: REQ-001; escenario **SC-AC-AUTH-001-HP-001**.
Given un usuario autenticado con sesión vigente.
When cierra sesión.
Then la sesión queda invalidada y las rutas protegidas exigen nuevo acceso.
Tests: pendientes. Implementation: pendiente. Verdict: NOT_TESTED.

### REQ-002 — Usuarios del negocio

Fuente: respuesta: acceso. Prioridad: CRITICAL; fase: MVP.
La aplicación administra exclusivamente Golden Print 3D. El primer usuario administra los demás; el bootstrap será único y atómico.

**AC-ACCESS-002** — parent: REQ-002; escenario **SC-AC-ACCESS-002-HP-001**.
Given dos solicitudes concurrentes y ningún propietario.
When ambas intentan crear el primer administrador.
Then solo una obtiene esa autoridad; los siguientes registros requieren autorización.
Tests: pendientes. Implementation: pendiente. Verdict: NOT_TESTED.

### REQ-003 — Permisos mínimos

Fuente: respuesta: acceso; propuesta. Prioridad: HIGH; fase: MVP (política propuesta).
Propuesta para aprobación: propietario/admin administra usuarios y finanzas; operador accede a clientes, pedidos, cotizaciones y catálogo; denegar gastos, finanzas y administración de usuarios al operador.

**AC-ROLE-003** — parent: REQ-003; escenario **SC-AC-ROLE-003-HP-001**.
Given un operador conforme a la política propuesta.
When solicita una operación reservada por interfaz o petición directa.
Then se deniega sin revelar información restringida.
Tests: pendientes. Implementation: pendiente. Verdict: NOT_TESTED.

### REQ-004 — Resumen administrativo

Fuente: §2. Prioridad: CRITICAL; fase: MVP.
Mostrar total y conteos No iniciado/Imprimiendo/Terminado/Entregado/Dañado, valor vendido, recaudo, saldo y utilidad; gráfico de distribución por estado.

**AC-DASH-004** — parent: REQ-004; escenario **SC-AC-DASH-004-HP-001**.
Given un conjunto conocido de pedidos y métricas.
When abre el dashboard.
Then cada conteo coincide con su lista filtrada y cada métrica coincide con Finanzas.
Tests: pendientes. Implementation: pendiente. Verdict: NOT_TESTED.

### REQ-005 — Datos y vistas de pedidos

Fuente: §3. Prioridad: CRITICAL; fase: MVP.
Tabla/cards con ID, nombre/proyecto, cliente, cotización, estados de cotización/pedido/pago, fechas, observaciones, costo de producción, precio y márgenes en COP y porcentaje.

**AC-ORDER-005** — parent: REQ-005; escenario **SC-AC-ORDER-005-HP-001**.
Given pedidos con todos sus datos.
When alterna tabla y cards.
Then las dos vistas conservan registros, estados y acciones disponibles.
Tests: pendientes. Implementation: pendiente. Verdict: NOT_TESTED.

### REQ-006 — Operación de pedidos

Fuente: §3. Prioridad: CRITICAL; fase: MVP.
Crear, modificar, consultar, cambiar estados, buscar, filtrar y ordenar; eliminación condicionada a integridad y relaciones financieras.

**AC-ORDER-006** — parent: REQ-006; escenario **SC-AC-ORDER-006-HP-001**.
Given un pedido con pagos o costos registrados.
When solicita eliminarlo.
Then la aplicación impide borrar su trazabilidad financiera y ofrece feedback explícito.
Tests: pendientes. Implementation: pendiente. Verdict: NOT_TESTED.

### REQ-007 — Estados independientes

Fuente: §3; respuesta: abonos/fallos. Prioridad: CRITICAL; fase: MVP.
Cotización: Falta por cotizar/Cotización enviada/Aceptada/Rechazada. Pedido: No iniciado/Imprimiendo/Terminado/Entregado/Dañado. Pago: Pendiente de pago/Pagado derivado de cobros; usar badges con texto.

**AC-STATE-007** — parent: REQ-007; escenario **SC-AC-STATE-007-HP-001**.
Given un pedido cobrado parcialmente.
When actualiza su estado de producción.
Then el pago permanece pendiente y los abonos se conservan.
Tests: pendientes. Implementation: pendiente. Verdict: NOT_TESTED.

### REQ-008 — Datos de clientes

Fuente: §4. Prioridad: CRITICAL; fase: MVP.
CRUD condicionado con nombre y contacto; propuesta MVP: email, Instagram/red social, notas y dirección opcionales.

**AC-CUSTOMER-008** — parent: REQ-008; escenario **SC-AC-CUSTOMER-008-HP-001**.
Given un cliente relacionado con un pedido.
When intenta eliminar el cliente.
Then no se pierde el historial ni se crea un pedido sin referencia válida.
Tests: pendientes. Implementation: pendiente. Verdict: NOT_TESTED.

### REQ-009 — Historial e indicadores

Fuente: §4. Prioridad: CRITICAL; fase: MVP.
Último pedido, cantidad, ventas acumuladas, saldo, ranking por número y valor de pedidos, e historial navegable.

**AC-CUSTOMER-009** — parent: REQ-009; escenario **SC-AC-CUSTOMER-009-HP-001**.
Given clientes con pedidos y pagos de importes conocidos.
When abre historial y ranking.
Then totales y posiciones coinciden con sus pedidos y saldos usando reglas compartidas.
Tests: pendientes. Implementation: pendiente. Verdict: NOT_TESTED.

### REQ-010 — Métricas financieras

Fuente: §5, §17. Prioridad: CRITICAL; fase: MVP.
Ventas, producción, margen bruto valor/%, recaudo/tasa de cobro, cartera/%, pérdidas, OPEX y utilidad neta con fórmulas únicas documentadas en FINANCIAL_RULES.md.

**AC-FINANCE-010** — parent: REQ-010; escenario **SC-AC-FINANCE-010-HP-001**.
Given el mismo conjunto de eventos y período.
When consulta dashboard, pedidos y finanzas.
Then las mismas métricas devuelven el mismo resultado y base temporal; estimación no se confunde con costo real.
Tests: pendientes. Implementation: pendiente. Verdict: NOT_TESTED.

### REQ-011 — Filtros de fechas

Fuente: §5, §6; respuesta: moneda. Prioridad: CRITICAL; fase: MVP.
Última semana, último mes, últimos 3 meses, año actual, histórico y rango personalizado en finanzas/gastos; fechas operativas America/Bogota.

**AC-PERIOD-011** — parent: REQ-011; escenario **SC-AC-PERIOD-011-HP-001**.
Given eventos dentro y fuera del rango elegido.
When aplica el filtro.
Then solo los eventos incluidos según límites documentados alimentan tablas y gráficas.
Tests: pendientes. Implementation: pendiente. Verdict: NOT_TESTED.

### REQ-012 — Evolución, caja y equilibrio

Fuente: §5. Prioridad: CRITICAL; fase: MVP.
Gráficas de evolución, entradas/salidas/flujo neto, OPEX por categoría y progreso del punto de equilibrio; documentar denominadores cero y casos sin equilibrio.

**AC-FINANCE-012** — parent: REQ-012; escenario **SC-AC-FINANCE-012-HP-001**.
Given un período sin ventas y con egresos.
When consulta finanzas.
Then ve flujo negativo y un estado de equilibrio explicable sin NaN, infinito ni porcentaje engañoso.
Tests: pendientes. Implementation: pendiente. Verdict: NOT_TESTED.

### REQ-013 — Pérdidas y reimpresión

Fuente: §5; respuesta: costos/fallos. Prioridad: CRITICAL; fase: MVP.
MVP: registrar impresión dañada, material perdido y otros costos atribuibles, separando pérdidas independientes de costos de intentos. Los fallos se reimprimen para el mismo pedido y acumulan costos reales sin duplicar pérdidas. Trabajos no cobrados permanecen como saldo pendiente; la declaración explícita de incobrabilidad/castigo de cartera se conserva en NEXT conforme a PRD y FINANCIAL_RULES, sin convertir automáticamente cartera en pérdida.

**AC-LOSS-013** — parent: REQ-013; escenario **SC-AC-LOSS-013-HP-001**.
Given un pedido con un intento fallido y su reimpresión.
When registra costos de ambos intentos.
Then ambos pertenecen al mismo pedido; el costo fallido entra una sola vez en resultados.
Tests: pendientes. Implementation: pendiente. Verdict: NOT_TESTED.

### REQ-014 — Gestión de gastos

Fuente: §6. Prioridad: CRITICAL; fase: MVP.
CRUD de gastos con fecha, descripción, categoría, valor, responsable y observaciones; integrar finanzas automáticamente sin doble imputación de costos directos.

**AC-EXPENSE-014** — parent: REQ-014; escenario **SC-AC-EXPENSE-014-HP-001**.
Given un gasto válido.
When lo guarda o corrige.
Then tabla y finanzas reflejan el importe vigente una sola vez.
Tests: pendientes. Implementation: pendiente. Verdict: NOT_TESTED.

### REQ-015 — Análisis de egresos

Fuente: §6. Prioridad: CRITICAL; fase: MVP.
Gastos por categoría, tiempo y responsable, tabla detallada y filtros de fechas.

**AC-EXPENSE-015** — parent: REQ-015; escenario **SC-AC-EXPENSE-015-HP-001**.
Given gastos de distintas categorías y responsables.
When aplica un período.
Then tabla y gráficos suman el mismo total de egresos filtrados.
Tests: pendientes. Implementation: pendiente. Verdict: NOT_TESTED.

### REQ-016 — Catálogo y costo por gramo

Fuente: §7. Prioridad: CRITICAL; fase: MVP.
Marca, modelo, material/tipo, color, valor comprado, peso del rollo y valor por gramo automático = valor comprado/peso positivo.

**AC-FILAMENT-016** — parent: REQ-016; escenario **SC-AC-FILAMENT-016-HP-001**.
Given un rollo de 1000 g comprado por 80000 COP.
When lo guarda.
Then el costo por gramo es 80 COP; peso cero o negativo se rechaza.
Tests: pendientes. Implementation: pendiente. Verdict: NOT_TESTED.

### REQ-017 — Proyecto y materiales

Fuente: §8. Prioridad: CRITICAL; fase: MVP.
Nombre/figura/proyecto, cliente opcional, descripción, múltiples materiales agregables/eliminables con filamento, gramos, costo/gramo y subtotal.

**AC-QUOTE-017** — parent: REQ-017; escenario **SC-AC-QUOTE-017-HP-001**.
Given dos materiales de 10 g a 80 y 20 g a 100 COP.
When calcula la cotización.
Then material suma 2800 COP y retirar una línea actualiza el total.
Tests: pendientes. Implementation: pendiente. Verdict: NOT_TESTED.

### REQ-018 — Duración y energía

Fuente: §8, §9; fórmula del usuario. Prioridad: CRITICAL; fase: MVP.
Tiempo editable en horas/minutos/segundos: H=h+min/60+seg/3600; energía=H*0.15*1100 COP inicialmente; potencia y tarifa editables.

**AC-TIME-018** — parent: REQ-018; escenario **SC-AC-TIME-018-HP-001**.
Given 1 hora, 30 minutos y 0 segundos.
When calcula con potencia 0.15 y tarifa 1100.
Then H es 1.5 y energía es 247.5 COP antes de redondeo.
Tests: pendientes. Implementation: pendiente. Verdict: NOT_TESTED.

### REQ-019 — Máquina y contingencia

Fuente: §8, §9; fórmula del usuario. Prioridad: CRITICAL; fase: MVP.
Máquina=H*2000 inicialmente; contingencia=material*0.10. Tarifa y porcentaje editables; no sustituir contingencia por probabilidad de reimpresión.

**AC-MACHINE-019** — parent: REQ-019; escenario **SC-AC-MACHINE-019-HP-001**.
Given H=1.5 y material=2800 COP.
When calcula con valores iniciales.
Then máquina=3000 y contingencia=280 COP; riesgo no se aplica a máquina o energía.
Tests: pendientes. Implementation: pendiente. Verdict: NOT_TESTED.

### REQ-020 — Costo de cotización

Fuente: §9; fórmula del usuario. Prioridad: CRITICAL; fase: MVP.
Costo producción=material+energía+máquina+contingencia+SUM(postprocesado); preservar componentes y distinguir estimado de ejecutado.

**AC-COST-020** — parent: REQ-020; escenario **SC-AC-COST-020-HP-001**.
Given material=2800, energía=247.5, máquina=3000, contingencia=280.
When calcula costo base.
Then obtiene costo base 6327.5 COP; con PP=1000, costo producción=7327.5 y oferta 2x=14655 COP antes de redondeo.
Tests: pendientes. Implementation: pendiente. Verdict: NOT_TESTED.

### REQ-021 — Postprocesado flexible

Fuente: §8, §9; respuesta final: postprocesado. Prioridad: CRITICAL; fase: MVP.
Agregar múltiples costos de lijado, pintura, pegado, resina, armado, acabado y otros; sumarlos al costo antes de aplicar cada multiplicador. Contingencia continúa solo sobre material.

**AC-POST-021** — parent: REQ-021; escenario **SC-AC-POST-021-HP-001**.
Given costo base=10000 COP, PP=2000 COP y multiplicadores 2/2.5/3.
When calcula las ofertas.
Then costo=12000 COP, precios=24000/30000/36000; el PP no aumenta la contingencia de material.
Tests: pendientes. Implementation: pendiente. Verdict: NOT_TESTED.

### REQ-022 — Tres niveles configurables

Fuente: §10; fórmula del usuario. Prioridad: CRITICAL; fase: MVP.
Precios iniciales costo*2, costo*2.5 y costo*3; multiplicadores editables. Cada nivel muestra costo, margen COP, markup y margen sobre venta con bases etiquetadas.

**AC-PRICE-022** — parent: REQ-022; escenario **SC-AC-PRICE-022-HP-001**.
Given costo=10000 COP sin postprocesado.
When calcula niveles iniciales.
Then precios=20000/25000/30000; markup=100/150/200%; margen venta=50/60/66.6667%.
Tests: pendientes. Implementation: pendiente. Verdict: NOT_TESTED.

### REQ-023 — Ciclo de cotizaciones

Fuente: §11. Prioridad: CRITICAL; fase: MVP.
Guardar, editar, duplicar, consultar historial, marcar enviada, aceptar/rechazar y seleccionar oferta; duplicar no copia identidad ni estado aceptado.

**AC-QUOTE-023** — parent: REQ-023; escenario **SC-AC-QUOTE-023-HP-001**.
Given una cotización aceptada.
When la duplica.
Then crea otro identificador y un borrador editable independiente conservando la cotización original.
Tests: pendientes. Implementation: pendiente. Verdict: NOT_TESTED.

### REQ-024 — Identificadores y conversión

Fuente: §11, §13. Prioridad: CRITICAL; fase: MVP.
Identificadores separados de cotización/pedido sin colisiones. Convertir aceptada reutilizando datos pertinentes y trazabilidad; propuesta idempotente para un pedido por cotización.

**AC-ID-024** — parent: REQ-024; escenario **SC-AC-ID-024-HP-001**.
Given una cotización aceptada y dos intentos concurrentes de conversión.
When confirma ambos intentos.
Then se conserva una única relación propuesta sin IDs duplicados ni copias financieras.
Tests: pendientes. Implementation: pendiente. Verdict: NOT_TESTED.

### REQ-025 — Documento del cliente

Fuente: §12. Prioridad: CRITICAL; fase: MVP.
PDF con Golden Print 3D, número, cliente, proyecto, descripción, precio seleccionado, fecha, validez si aplica y notas; separar costos internos.

**AC-PDF-025** — parent: REQ-025; escenario **SC-AC-PDF-025-HP-001**.
Given una cotización con oferta seleccionada y cliente.
When descarga PDF.
Then el archivo legible contiene esos campos y omite material/energía/tarifas internas.
Tests: pendientes. Implementation: pendiente. Verdict: NOT_TESTED.

### REQ-026 — Anticipos y abonos

Fuente: §3, §5, §13; respuesta: pagos. Prioridad: CRITICAL; fase: MVP.
Múltiples anticipos/abonos con fecha y valor asociados al mismo pedido; sin devoluciones en MVP; saldo=precio-cobros válidos, estado pagado al completar precio.

**AC-PAYMENT-026** — parent: REQ-026; escenario **SC-AC-PAYMENT-026-HP-001**.
Given un pedido de 100000 COP.
When registra anticipo 30000 y abono 70000 con fechas distintas.
Then recaudo=100000, saldo=0, estado Pagado; historial conserva ambos pagos y sus fechas.
Tests: pendientes. Implementation: pendiente. Verdict: NOT_TESTED.

### REQ-027 — Costos reales

Fuente: respuesta: costos reales/fallos; §3, §5. Prioridad: CRITICAL; fase: MVP.
Registrar consumo real, energía, máquina, postprocesado y costos de intentos; conservar comparación estimado/real y atribución a pedido sin duplicar venta al reimprimir.

**AC-REAL-027** — parent: REQ-027; escenario **SC-AC-REAL-027-HP-001**.
Given un pedido con estimación y costos de dos intentos.
When consulta margen real.
Then usa costos registrados de ambos intentos y muestra la estimación como dato distinto.
Tests: pendientes. Implementation: pendiente. Verdict: NOT_TESTED.

### REQ-028 — Moneda y configuración

Fuente: respuesta: moneda/fórmula. Prioridad: CRITICAL; fase: MVP.
COP y America/Bogota; sin impuestos. Variables de materiales, potencia, tarifa energética, máquina, contingencia y multiplicadores editables; conservar valores utilizados por cotización.

**AC-LOCAL-028** — parent: REQ-028; escenario **SC-AC-LOCAL-028-HP-001**.
Given una cotización guardada y parámetros posteriores diferentes.
When consulta el documento original.
Then mantiene sus valores y precios guardados; una nueva cotización usa parámetros vigentes.
Tests: pendientes. Implementation: pendiente. Verdict: NOT_TESTED.

### REQ-029 — Flujos administrativos

Fuente: §14. Prioridad: CRITICAL; fase: MVP.
Desktop/móvil con modales/drawers pertinentes, combobox/desplegables, tablas/cards, badges, filtros/búsqueda, feedback y confirmaciones destructivas.

**AC-UX-029** — parent: REQ-029; escenario **SC-AC-UX-029-HP-001**.
Given un usuario en móvil.
When crea cotización, pedido y abono y cancela una eliminación.
Then completa los flujos sin pérdida de datos; cancelar deja el registro intacto.
Tests: pendientes. Implementation: pendiente. Verdict: NOT_TESTED.

### REQ-030 — Integridad del negocio

Fuente: §16. Prioridad: CRITICAL; fase: MVP.
Relacionar usuarios, clientes, cotizaciones, líneas/materiales, pedidos, filamentos, gastos, postprocesado y pagos; no adoptar lista orientativa como esquema definitivo.

**AC-DATA-030** — parent: REQ-030; escenario **SC-AC-DATA-030-HP-001**.
Given un material o cliente usado en un documento histórico.
When cambia su catálogo o intenta borrarlo.
Then el documento conserva datos de cálculo y referencia válida según política de integridad.
Tests: pendientes. Implementation: pendiente. Verdict: NOT_TESTED.

### REQ-031 — Fórmulas y auditoría

Fuente: §17, §18. Prioridad: CRITICAL; fase: MVP.
Una fuente de verdad para fórmulas; tests financieros con casos conocidos, edición de variables, costos/g/hora, porcentajes, recaudo/cartera, utilidad/pérdidas/equilibrio y fronteras.

**AC-CALC-031** — parent: REQ-031; escenario **SC-AC-CALC-031-HP-001**.
Given los casos numéricos definidos en estos criterios.
When se ejecuta la suite financiera después de aprobación e implementación.
Then cada cálculo coincide con la fórmula vigente; ceros y errores producen respuesta documentada.
Tests: pendientes. Implementation: pendiente. Verdict: NOT_TESTED.

### REQ-032 — Conservar visión y etapas

Fuente: §19. Prioridad: HIGH; fase: MVP.
MVP con todos los módulos solicitados; NEXT/FUTURE registra ampliaciones sin eliminar requisitos. Priorización es propuesta del blueprint.

**AC-ROADMAP-032** — parent: REQ-032; escenario **SC-AC-ROADMAP-032-HP-001**.
Given un requisito explícito que se aplaza.
When revisa el roadmap.
Then encuentra su fuente, fase prevista y criterio de inclusión en lugar de desaparecer.
Tests: pendientes. Implementation: pendiente. Verdict: NOT_TESTED.

### REQ-033 — Documentación y ADRs

Fuente: §20. Prioridad: CRITICAL; fase: MVP.
Mantener brief, requirements, PRD, stack, arquitectura, datos, API cuando aplique, UX, reglas financieras, implementación, tareas, riesgos y estado; ADRs relevantes.

**AC-DOC-033** — parent: REQ-033; escenario **SC-AC-DOC-033-HP-001**.
Given una decisión aprobada que modifica una fórmula o arquitectura.
When se actualiza el proyecto.
Then la decisión aparece en documento autoritativo y los derivados enlazan su versión.
Tests: pendientes. Implementation: pendiente. Verdict: NOT_TESTED.

### REQ-034 — Discovery y aprobación

Fuente: §21, §22, §24. Prioridad: CRITICAL; fase: MVP.
Solo preguntas críticas; distinguir confirmado/propuesto/pendiente. Presentar blueprint y resumen solicitado al completar revisiones; esperar aprobación antes de código.

**AC-GATE-034** — parent: REQ-034; escenario **SC-AC-GATE-034-HP-001**.
Given un blueprint sin aprobación.
When se evalúa avanzar a scaffold.
Then el proyecto permanece en documentación; las respuestas de discovery no se interpretan como aprobación del blueprint.
Tests: pendientes. Implementation: pendiente. Verdict: NOT_TESTED.

### REQ-035 — Lifecycle posterior

Fuente: §23. Prioridad: CRITICAL; fase: MVP.
Tras aprobación seguir finalización tecnológica, validación arquitectura/datos, plan/tareas, scaffold, auth/módulos/cálculos/cotizador/PDF, tests, seguridad, code review, build, documentación y entrega.

**AC-LIFE-035** — parent: REQ-035; escenario **SC-AC-LIFE-035-HP-001**.
Given la aprobación explícita del blueprint.
When el orquestador continúa.
Then ejecuta fases y validaciones pertinentes sin pedir permiso rutinario por fase.
Tests: pendientes. Implementation: pendiente. Verdict: NOT_TESTED.

## Cross-functional Requirements — propuestas para revisión

### CFR-001 — Seguridad administrativa

Sin sesión, todas las rutas y mutaciones administrativas se deniegan; la autorización propuesta se comprueba también en servidor.
**AC-SEC-001** — parent: CFR-001; **SC-AC-SEC-001-HP-001**.
Given una solicitud sin sesión.
When pide un recurso o mutación protegida.
Then no recibe datos ni cambia registros.
Verdict: NOT_TESTED; tests e implementación pendientes.

### CFR-002 — Accesibilidad responsive

Propuesta: flujos críticos operables por teclado, campos etiquetados, errores asociados y estado comprensible sin depender solo de color. Verificar desktop 1440 px y móvil 390 px.
**AC-A11Y-002** — parent: CFR-002; **SC-AC-A11Y-002-HP-001**.
Given un viewport móvil y navegación por teclado.
When realiza creación de pedido y pago.
Then puede operar controles y entender estados/errores; las tablas admiten desplazamiento controlado.
Verdict: NOT_TESTED; tests e implementación pendientes.

### CFR-003 — Exactitud y consistencia

Aritmética decimal COP, rechazo de pesos cero, costos negativos y tiempo inválido; ningún cálculo financiero devuelve NaN/infinito. Propuesta de redondeo consistente en reglas financieras.
**AC-PRECISION-003** — parent: CFR-003; **SC-AC-PRECISION-003-HP-001**.
Given datos inválidos o denominador cero.
When intenta calcular o guardar.
Then recibe validación explícita o estado no aplicable documentado y no persiste un importe incorrecto.
Verdict: NOT_TESTED; tests e implementación pendientes.

### CFR-004 — Integridad concurrente

Bootstrap y conversión deben soportar peticiones concurrentes sin duplicar privilegios, documentos o cobros por reintento.
**AC-RACE-004** — parent: CFR-004; **SC-AC-RACE-004-HP-001**.
Given dos solicitudes con la misma identidad de operación.
When se procesan concurrentemente.
Then existe un único resultado financiero y la segunda respuesta referencia el resultado existente.
Verdict: NOT_TESTED; tests e implementación pendientes.

### CFR-005 — Rendimiento medible

Propuesta para validación: con 10000 pedidos, listados paginados y dashboard alcanzan P95 <=2 s bajo 10 sesiones concurrentes en entorno acordado; registrar condiciones y resultado.
**AC-PERF-005** — parent: CFR-005; **SC-AC-PERF-005-HP-001**.
Given datos y entorno de carga documentados.
When ejecuta la prueba prevista después de implementación.
Then el P95 cumple la meta propuesta o se registra incumplimiento antes de entrega.
Verdict: NOT_TESTED; tests e implementación pendientes.

## Constraints y propuestas distinguibles

Confirmado: Next.js/TypeScript, Better Auth, Neon PostgreSQL, Vercel; COP, America/Bogota, sin impuestos; negocio exclusivo; primer usuario administra usuarios; anticipos/abonos sin devoluciones; costos reales y reimpresiones del mismo pedido; fórmula anterior.
Propuesto: roles propietario/admin y operador, mínimo privilegio, datos opcionales de clientes en MVP, eliminación conservadora, conversión idempotente, metas CFR y fases NEXT/FUTURE. Arquitectura decide tecnología adicional con justificación; este documento no selecciona ORM ni librerías.
No asumir que entrega implica pago ni que cotización implica venta. Reconocimiento de métricas será regla explícita de blueprint, no respuesta inventada del usuario.

## Success metrics, revisión y glosario

Éxito verificable propuesto: todos los AC críticos aceptados y probados después de implementación; fórmulas iguales en pantallas; bootstrap concurrente único; historial de pagos y costos sin duplicación; PDF exportable; flujos administrativos desktop/móvil operables. Cobertura actual de tests: cero, esperada en fase posterior.
Glosario: markup usa costo como denominador; margen sobre venta usa precio; recaudo son cobros con fecha propia; cartera es saldo por pedido; contingencia es reserva del 10% del material; costo real incluye intentos ejecutados; OPEX son gastos operativos clasificados. La reserva estimada no es pérdida ejecutada ni salida automática de caja.
Las reglas propuestas de reconocimiento entregado, cohortes de recaudo/cartera, caja por movimiento, OPEX separado y equilibrio por contribución se definen en [FINANCIAL_RULES.md](FINANCIAL_RULES.md) §§7–9. Son decisiones de blueprint para aprobar, no respuestas atribuidas al usuario. Los castigos de cartera/incobrabilidad se conservan en NEXT.
Trazabilidad bidireccional REQ/CFR → AC → SC en `.traceability.yaml`; tests e IMPL vacíos son brechas de fase conocidas, no aprobaciones. Cada AC nombra su parent.
Siguiente revisión: verificar fórmulas confirmadas y reglas financieras propuestas con propietario; reconciliar reglas financieras, datos, UX y permisos con especialistas; integrar blueprint. No emitir gate final hasta resolver dependencias y completar revisiones.

## Change History

2026-10-02 v0.2: requisitos canónicos iniciales derivados de fuente y respuestas; sustituye dudas de intake por decisiones confirmadas y postprocesado confirmado.
