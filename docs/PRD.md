> Nota de vigencia (2026-10-09): documento de diseño o evidencia de una etapa anterior. Sus propuestas, estados y resultados conservan su fecha y alcance. Para reglas actuales, consultar [índice vigente](README.md), [estado](PROJECT_STATUS.md) y [mejoras pendientes](IMPROVEMENTS.md). No usar afirmaciones históricas de falta de código/publicación o costos reales obligatorios como descripción de la aplicación actual.

# PRD — Golden Print 3D

> Regla vigente (2026-10-05, corrección del usuario): el costo del pedido se obtiene directamente del costo de producción de la revisión aceptada de la cotización, o de su ajuste explícito en el pedido. No se registra ni confirma otro costo real; la ganancia es precio acordado menos ese costo. Los registros anteriores de costos se conservan como historial y no se suman nuevamente. Los apartados históricos que exigen registro/completitud de costos quedan sustituidos por esta regla. El costo de producción no crea un movimiento de caja.

Versión: 0.2 · Fecha: 2026-10-02 · Estado: borrador de blueprint para integración, no aprobado.
Autor: scribe. Revisión: Project Orchestrator, producto, arquitectura, QA y propietario (pendiente).
Audiencia: propietario, producto, finanzas, arquitectura, UX, desarrollo y QA.

## Problema, objetivo y usuarios

Golden Print 3D necesita centralizar pedidos, cotizaciones, clientes, filamentos, gastos y finanzas. Debe distinguir ventas, recaudo, cartera, costos estimados/reales y utilidad; administrar sin duplicar documentos ni fórmulas.
Usuario confirmado: equipo del único negocio Golden Print 3D. El primer usuario administra usuarios. Propuesta de perfiles: propietario/admin y operador con permisos mínimos de REQUIREMENTS REQ-003.
Fuente de comportamiento y criterios: [REQUIREMENTS.md](REQUIREMENTS.md); este PRD deriva de sus IDs. Fuente factual e historial: [DISCOVERY.md](DISCOVERY.md). No es aprobación del blueprint.

## Scope y prioridades

| Fase propuesta | Funcionalidades | Trazabilidad |
|---|---|---|
| MVP | Better Auth, bootstrap y usuarios autorizados, dashboard completo | REQ-001–004 |
| MVP | Pedidos tabla/cards, estados, CRUD condicionado, filtros y búsqueda | REQ-005–007 |
| MVP | Clientes, campos opcionales sencillos, historial y ranking | REQ-008–009 |
| MVP | Finanzas, períodos, caja, OPEX, pérdidas y equilibrio | REQ-010–013 |
| MVP | Gastos con análisis por categoría/tiempo/responsable | REQ-014–015 |
| MVP | Catálogo de filamentos y costo/gramo | REQ-016 |
| MVP | Cotizador multilateral, horas/minutos/segundos, energía, máquina, contingencia y tres precios editables | REQ-017–022 |
| MVP | Cotizaciones, historial, oferta, identificadores, conversión trazable y PDF | REQ-023–025 |
| MVP | Anticipos/abonos, costos reales y reimpresiones | REQ-026–028 |
| MVP | UX responsive, integridad y tests financieros | REQ-029–031; CFR-001–005 |
| MVP | Documentación, revisión, gate y lifecycle | REQ-032–035 |
| NEXT | Nombres personalizables de niveles; incobrabilidad/castigos auditados; proveedor, fecha de compra, diámetro y ubicación del filamento | Fuente §7, §10; REQ-032 |
| FUTURE | Gramos restantes, inventario de consumo y movimientos/stock | Fuente §7; REQ-032 |

Todas las fases son propuesta para aprobación, no recortes de visión. Los módulos financieros completos y postprocesado siguen dentro de MVP; PP se suma al costo antes de multiplicar.
Todas las necesidades centrales son críticas según prioridad del usuario; no se usa un límite artificial de Must para retirar módulos solicitados. El volumen requiere milestones, no reducir alcance silenciosamente.

## Casos de uso y aceptación

| Historia | Beneficio | Criterios derivados |
|---|---|---|
| Como administrador, gestiono acceso al negocio | Datos restringidos a personal autorizado | AC-AUTH-001, AC-ACCESS-002, AC-ROLE-003, AC-SEC-001 |
| Como operador, registro cliente y preparo cotización con materiales y tiempo | Oferta calculada y trazable | AC-CUSTOMER-008, AC-QUOTE-017, AC-TIME-018, AC-MACHINE-019, AC-COST-020, AC-POST-021, AC-PRICE-022 |
| Como operador, envío PDF y convierto una oferta aceptada | Producción ligada al documento comercial | AC-QUOTE-023, AC-ID-024, AC-PDF-025 |
| Como operador, gestiono producción y fallos | Costos reales en el mismo pedido | AC-ORDER-005, AC-ORDER-006, AC-STATE-007, AC-LOSS-013, AC-REAL-027 |
| Como administrador, registro anticipos y cobros | Cartera y caja verificables | AC-PAYMENT-026, AC-LOCAL-028 |
| Como administrador, reviso clientes, egresos y resultados | Decisiones con métricas consistentes | AC-DASH-004, AC-CUSTOMER-009, AC-FINANCE-010, AC-PERIOD-011, AC-FINANCE-012, AC-EXPENSE-014, AC-EXPENSE-015 |
| Como operador, consulto filamento y trabajo desde móvil | Menos captura y errores | AC-FILAMENT-016, AC-UX-029, AC-A11Y-002 |

Las demás AC de datos, cálculos, roadmap, documentación y lifecycle son transversales: REQUIREMENTS define todos los criterios BDD. No se duplican versiones divergentes aquí.

## Modelo comercial confirmado

COP, America/Bogota, sin impuestos. Se aceptan anticipos y abonos con fecha/valor; no devoluciones. Precio de cotización y costos estimados se conservan; costos reales incluyen reimpresiones.
Fórmula autoritativa: `H=h+min/60+seg/3600`, `M=sum(g*p)`, `E=H*0.15*1100`, `A=H*2000`, `K=M*0.10`, `C=M+E+A+K+SUM(postprocesado)`; ofertas `C*2`, `C*2.5`, `C*3`. Variables editables.
El multiplicador no se etiqueta como margen: markup inicial 100/150/200%; margen sobre venta 50/60/66.6667%. La contingencia se aplica solo al material.
Confirmado en respuesta final: sumar PP al costo antes de multiplicadores; la contingencia sigue solo sobre material. Con base=10000 y PP=2000, precios=24000/30000/36000 COP.
Las fórmulas globales de utilidad, equilibrio, reconocimiento por período y caja derivan de las propuestas de [FINANCIAL_RULES.md](FINANCIAL_RULES.md) §§7–9, para aprobación; no sustituir costo real por reserva estimada ni duplicar una pérdida como otro gasto.

## UX, calidad y métricas de éxito propuestas

Administración desktop/móvil, modales/drawers pertinentes, tablas/cards, búsqueda/filtros, badges con texto, feedback, estados vacíos/errores y confirmaciones destructivas.
Criterios de éxito: conversión única y trazable; registrar pagos parciales sin alterar estado de producción; registrar fallo y reimpresión sin otra venta; importes coincidentes entre módulos; PDF con precio elegido sin costos internos; completar flujos críticos por teclado y móvil.
CFR-001–005 definen pruebas de seguridad, accesibilidad, precisión, concurrencia y objetivo de rendimiento propuesto. No hay mediciones observadas todavía.

## Fuera de alcance y dependencias

Sin multiempresa, tienda pública, pagos en línea, facturación fiscal, impuestos, devoluciones, integración física de impresora/CAD/slicing. Inventario avanzado conservado en FUTURE.
Dependencias: diseño de datos y fórmulas financieras coherentes, UX, revisión de arquitectura/seguridad/QA, aprobación del blueprint y posteriormente cuentas Neon/Vercel para operación real.
No se define arquitectura ni stack adicional en PRD. Better Auth, Next.js/TypeScript, Neon y Vercel son restricciones del usuario.

## Riesgos y handoff

La fórmula PP está confirmada; sus líneas deben quedar incluidas antes de multiplicadores. Roles propuestos requieren revisión en gate. Abonos, reimpresiones y compras de material pueden distorsionar utilidad si se duplican o usan fechas equivocadas; FINANCIAL_RULES y datos deben resolverlo conjuntamente.
Siguiente acción: integrar requisitos y fórmulas confirmadas, revisar por especialistas y consolidar blueprint. Approval gate corresponde al orquestador después de revisiones; no está alcanzado en este entregable.

## Change History

2026-10-02 v0.2: definición de producto inicial con todas las áreas del MVP, ampliaciones preservadas y fórmulas confirmadas.
