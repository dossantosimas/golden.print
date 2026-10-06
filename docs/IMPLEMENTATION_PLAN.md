# Plan de trabajo — Golden Print 3D

Estado: propuesta; ejecución condicionada a aprobación del blueprint. Este documento no autoriza scaffold ni código. Definiciones: REQUIREMENTS.md, TECHNOLOGY_STACK.md, ARCHITECTURE.md, DATABASE_DESIGN.md, API_DESIGN.md, UX_PLAN.md y FINANCIAL_RULES.md.

Actualizado: 2026-10-03, America/Bogota. El objetivo es entregar una aplicación interna utilizable, con login de marca, gestión de usuarios, cotizaciones, pedidos, producción, pagos y finanzas. Discovery y blueprint están terminados; el trabajo solicitado ahora es concretar su ejecución. No hay aplicación funcional todavía.

## Qué haremos, cómo y con qué agentes

Los IDs corresponden a [TASKS.md](TASKS.md). Cada etapa produce un resultado revisable antes de comenzar las tareas que dependen de ella.

| Etapa / tareas | Qué haremos | Cómo lo haremos | Agentes o subagentes | Resultado y criterio de aceptación |
|---|---|---|---|---|
| 0. Preparación y aprobación — T01–T03 | Consolidar decisiones, marca, alcance y este plan | Mantener los requisitos confirmados y presentar el blueprint completo al propietario; incorporar cambios solicitados | `nexus` coordina; `project_manager` revisa secuencia; `scribe` mantiene requisitos | T01/T02 completadas; aprobación explícita pendiente en T03 |
| 1. Tecnología y contratos — T04 | Fijar versiones y contratos de autenticación, datos y dinero | Verificar documentación oficial y compatibilidad; fijar dependencias; validar arquitectura, esquema Better Auth, permisos, transacciones y snapshots | `research_agent`, `atlas`, `database_architect` | Contratos consistentes y versiones compatibles antes de crear la app |
| 2. Base y diseño de marca — T05 | Crear Next.js/TypeScript, PostgreSQL y sistema visual shadcn/ui | Scaffold con npm; migraciones Drizzle; configuración de desarrollo; shadcn oficial con Base UI; tokens marfil/carbón/dorado centralizados; incorporar logos originales como activos de la app | `frontend_developer`, `database_architect`, `cicd_expert`; revisión visual de `uiux_designer` | App local arranca; esquema aplicado; configuración documentada; typecheck/lint/build pasan |
| 3. Login y usuarios — T06–T07 | Permitir acceso privado y administración de usuarios | Better Auth; primer administrador mediante provisionamiento privado; login con logo completo; autorización en servidor; roles administrador/operador; desactivación revoca sesiones y protege último administrador | `backend_developer`, `frontend_developer`, `security_auditor` | Login/logout y sesiones funcionan; sin registro público; pruebas de permisos y concurrencia del último administrador pasan |
| 4. Clientes y filamentos — T08 | Crear catálogos utilizables por el cotizador | CRUD validado en servidor, búsqueda/paginación, archivo de registros referenciados y costo por gramo decimal; preparar historial de clientes | `backend_developer`, `frontend_developer` | Datos persistentes y validación de formularios; el ranking se completa cuando existan las métricas de T16 |
| 5. Cotizador y revisiones — T09–T10 | Calcular y guardar cotizaciones con variables editables | Función financiera única con decimal.js; materiales múltiples; h/m/s; energía, máquina y contingencia; postprocesado antes de multiplicadores; guardar valores y parámetros por revisión; redondear precio final a COP entero | `backend_developer`, `frontend_developer`, `test_generator` | Casos manuales, precisión y límites pasan; una revisión conserva sus valores aunque cambien las tarifas |
| 6. PDF y pedidos — T11–T12 | Descargar cotización comercial y convertirla a pedido | PDF desde revisión autorizada, con campos comerciales permitidos y sin notas/costos internos; conversión transaccional e idempotente; vistas tabla/cards, filtros, estados y detalle | `backend_developer`, `frontend_developer`; revisión de `uiux_designer` | PDF legible con tildes/textos largos; solicitudes repetidas crean un solo pedido; cliente requerido al confirmar pedido |
| 7. Producción y abonos — T13–T14 | Registrar impresiones fallidas, reimpresiones, costos reales y cada pago | Intentos ligados al mismo pedido; separar estimados de reales; registrar pago con fecha e importe; derivar saldo/estado desde pagos válidos; transacciones para evitar duplicados y sobrepagos | `backend_developer`, `frontend_developer`, `test_generator` | Flujo fallo→reimpresión y anticipos/abonos verificable; caja se registra una vez; sin devoluciones |
| 8. Gastos, finanzas y dashboard — T15–T16 | Mostrar caja, cuentas por cobrar, utilidad, pérdidas y equilibrio | Registrar egresos con origen; distinguir cobros de ventas entregadas; reutilizar consultas financieras; incluir costos fallidos una vez; evitar doble conteo de compras; mostrar métricas provisionales cuando faltan costos | `backend_developer`, `frontend_developer`, `analytics_reporter` | Oráculos de FINANCIAL_RULES/QA_PLAN pasan; fechas Bogota correctas; gráficos con equivalentes textuales y ranking de clientes coherente |
| 9. QA y revisiones — T17–T18 | Verificar el flujo completo y corregir defectos | Pruebas unitarias, integración en PostgreSQL y E2E; revisión independiente de seguridad/código; teclado, móvil 360 px y escritorio; correcciones y nueva comprobación del área afectada | `test_generator`, `uiux_designer`, `security_auditor`, `code_reviewer` | Flujo cotizar→pedido→fallo→reimpresión→abono→entrega pasa; sin hallazgos críticos/importantes abiertos |
| 10. Entrega — T19 | Entregar aplicación validada y guía de operación | Ejecutar checks finales; documentar arranque, variables, migraciones, respaldos/recuperación y preparación para Vercel; actualizar estado y trazabilidad con evidencia | `cicd_expert`, `doc_generator`, `nexus` | Entrega local reproducible y documentada; despliegue productivo solo cuando se autoricen servicio, costo y publicación |

## Equipo y responsabilidades

`nexus` es el rol de orquestación que desempeño en este chat: asigno tareas, integro resultados, resuelvo dependencias y mantengo estado y alcance. Los demás nombres identifican especialistas existentes del framework que se activarán mediante sesiones reales de subagentes cuando su tarea esté lista; no estarán todos trabajando simultáneamente.

- `project_manager`: revisa el plan, prioridades y dependencias; no sustituye decisiones del propietario ni promete fechas sin base.
- `research_agent` y `atlas`: verifican tecnología y contratos antes de implementación; vuelven a intervenir si una incompatibilidad exige decisión técnica.
- `database_architect`: migraciones, relaciones, restricciones e integridad transaccional.
- `uiux_designer` y `frontend_developer`: diseño y construcción de la interfaz usando [frontend-design-pro](C:/Users/dossa/.agents/skills/frontend-design-pro/SKILL.md) y la [skill oficial shadcn](../../codex-framework/framework/skills/design/shadcn/SKILL.md). Componentes, logo, paleta y accesibilidad siguen [SHADCN_UI_PLAN.md](SHADCN_UI_PLAN.md). No se crea un agente separado llamado «shadcn».
- `backend_developer`: lógica de negocio, autorización, persistencia, cálculos y PDF.
- `analytics_reporter`: revisa definición y presentación de las métricas operativas con las reglas del proyecto.
- `test_generator`, `security_auditor` y `code_reviewer`: verificación y revisión independiente; el autor de un cambio no será su único verificador.
- `cicd_expert` y `doc_generator`: validación técnica de entrega y documentación; `scribe` conserva requisitos cuando haya cambios aprobados.

## Reglas de negocio que gobiernan la ejecución

Empresa única; interfaz en español; COP; America/Bogota; sin impuestos. Primer usuario administrador y usuarios internos con permisos. Anticipos/abonos con fecha y valor, sin devoluciones. Las reimpresiones pertenecen al pedido original y sus costos reales afectan su resultado.

La fórmula canónica será: `horas = h + m/60 + s/3600`; material = suma de gramos por precio/gramo; energía = horas × 0.15 × 1100; máquina = horas × 2000; contingencia = material × 0.10; costo de producción = material + energía + máquina + contingencia + postprocesado; precios = costo × 2, × 2.5 y × 3. Tarifas y multiplicadores editables, parámetros conservados por cotización. [FINANCIAL_RULES.md](FINANCIAL_RULES.md) define precisión, costos reales, caja y reportes; ningún módulo crea una fórmula alternativa.

## Seguimiento y dudas

Se seguirá [TASKS.md](TASKS.md) con estados TODO → IN_PROGRESS → REVIEW → DONE. Cada asignación tendrá entradas, archivos exclusivos, salida y criterio de aceptación. [PROJECT_STATUS.md](PROJECT_STATUS.md) registrará avance real, evidencia, bloqueos y siguiente acción; la trazabilidad vinculará requisitos con implementación/pruebas. Una maqueta o un documento no cuenta como funcionalidad terminada.

No hay dudas de negocio que impidan este plan. No se fija una fecha de entrega sin comprobar primero el entorno, las dependencias y el ritmo de implementación. Los datos externos que harán falta se pedirán en su momento: acceso/configuración de PostgreSQL para integración y cuenta/plan de Vercel si se publica. Los secretos se configuran en el entorno, nunca en los documentos ni en el repositorio.

Si aparece una decisión que cambie alcance, reglas de negocio, costos o publicación, se presentará su impacto y una pregunta concreta. Tras aprobar el blueprint, las decisiones rutinarias y las fases ya autorizadas continuarán sin pedir confirmación en cada etapa.

## Milestones y dependencias

| Hito | Resultado utilizable | Dependencias | Validación / gate |
|---|---|---|---|
| M0 — Blueprint | Reglas, alcance, arquitectura, riesgos y tareas revisados | Discovery y revisiones | Aprobación del propietario |
| M1 — Base y acceso | App local, migraciones, primera cuenta administradora y gestión de usuarios | M0 aprobado; pins estables; DB de desarrollo | Typecheck/lint/build; integración bootstrap, sesiones, permisos y último admin |
| M2 — Cotizar | Clientes y filamentos; cotizador multimatérial h/m/s; revisiones y PDF | M1; contratos financieros | Pruebas unitarias de fórmula/redondeo; persistencia snapshot; E2E cotización y PDF |
| M3 — Operar | Pedidos tabla/cards, conversión única, intentos y reimpresión, abonos | M2 | Integración concurrencia conversión/pagos; costo real; E2E pedido→entrega |
| M4 — Administrar | Gastos, caja, pérdidas, finanzas/dashboard con una fuente de métricas | M3 | Cohortes/fechas, compras sin doble conteo, utilidad y equilibrio; UX móvil |
| M5 — Entregar | Seguridad y code review cerrados; build y documentación de operación | M4 | Matriz requisitos/pruebas; cero hallazgos críticos/importantes abiertos; entrega local verificable |

## Secuencia después de «Aprobado»

TECHNOLOGY_FINALIZATION → ARCHITECTURE_VALIDATION → validación DATABASE_DESIGN → IMPLEMENTATION_PLANNING/TASK BREAKDOWN → SCAFFOLD → AUTHENTICATION → CORE MODULES → FINANCIAL CALCULATIONS/QUOTATION ENGINE → PDF → TESTING → SECURITY_REVIEW → CODE_REVIEW → BUILD_VALIDATION → DOCUMENTATION → DELIVERY.

El diseño se valida antes de iniciar cada dependencia. Los cálculos puros se implementan al comenzar M2, para que cotizaciones, pedidos y reportes no creen fórmulas propias. PDF sigue a snapshot de cotización, y finanzas siguen a datos reales de pagos/producción/gastos.

## Trabajo paralelo permitido

- Clientes y filamentos pueden avanzar en paralelo tras aprobar sus contratos y migraciones.
- El cálculo puro y sus casos de prueba de T09 pueden prepararse en paralelo con T08, una vez fijados los contratos; cerrar el cotizador integrado requiere las APIs de los catálogos. El ranking financiero de clientes se termina en T16, evitando que T08 dependa de métricas aún no implementadas.
- Generación PDF puede avanzar junto a presentación de pedidos cuando el snapshot y contrato de PDF estén estabilizados.
- Gráficos UX y consultas de métricas pueden avanzar en paralelo solo tras fijar nombres, bases temporales y tipos de dinero.
- Revisión de seguridad y QA pueden preparar casos durante implementación; las conclusiones finales requieren la versión real.
- No ejecutar escrituras concurrentes sobre el mismo archivo; cada especialista recibe rutas y contratos definidos.

## Validación por hito

Comandos a configurar en M1: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run test:integration`, `npm run test:e2e` y `npm run build`. Usar únicamente los apropiados al hito y completar todos los requeridos antes de entrega. Las pruebas SQL usan PostgreSQL real separado de producción. No afirmar equivalencia de mocks o SQLite para locks/constraints PostgreSQL.

Cada resultado pasa implementador → code_reviewer → correcciones → QA antes de DONE. Las pruebas financieras incluyen resultados calculados manualmente, límites y invariantes; no duplicar la función productiva para obtener el esperado. Registrar evidencia, fecha, alcance y limitaciones en PROJECT_STATUS.md y reportes de review.

## Dependencias externas y despliegue

Se necesita Neon de desarrollo y variables privadas antes de probar integración real. Una base local PostgreSQL es alternativa para desarrollo si Neon aún no está disponible; Neon productivo sigue siendo el destino aprobado. No sustituir silenciosamente la persistencia por datos simulados.

Vercel empresarial requiere plan compatible (Pro propuesto) y aprobación de coste antes de contratación. Preparar build/configuración/documentación antes de solicitar el gate de deployment productivo. No solicitar autorización fase por fase; detener únicamente ante cambios de alcance, recursos externos indispensables o gates del framework. Sin credenciales o deployment autorizado, entregar y validar localmente lo posible y registrar el bloqueo externo de forma precisa.

## Reanudación y control de alcance

Leer PROJECT_STATUS, PROJECT_BRIEF, REQUIREMENTS, TECHNOLOGY_STACK, ARCHITECTURE y TASKS para reanudar. No reiniciar discovery ni reabrir decisiones confirmadas. Cambios de producto se registran con nueva decisión/requisito y ADR cuando corresponda; no degradar el MVP sin autorización.

NEXT/FUTURE siguen en PRD/REQUIREMENTS con motivos explícitos. No instalar servicios de correo, pagos, stock avanzado ni tracking de impresora como requisito implícito.
