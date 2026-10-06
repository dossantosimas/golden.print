# Tareas

Estado del plan: aprobado por el propietario el 2026-10-03. Implementación creada; QA y revisión independientes en curso. Estados permitidos: TODO, IN_PROGRESS, BLOCKED, REVIEW, DONE. Ver criterios detallados en los documentos enlazados desde IMPLEMENTATION_PLAN.md; IDs de requisitos/aceptación se mantienen en REQUIREMENTS y .traceability.yaml.

| ID | Título / descripción | Responsable | Depende de | Prioridad | Criterio observable de aceptación | Estado |
|---|---|---|---|---|---|---|
| T01 | Finalizar discovery y conservar decisiones | nexus + scribe | Respuestas del propietario | P0 | Fórmula, PP, moneda, pagos, usuarios y reimpresión confirmados; visión preservada | DONE |
| T02 | Preparar y revisar blueprint | nexus, research_agent, database_architect, uiux_designer, security_auditor, test_generator, code_reviewer | T01 | P0 | Documentos coherentes, revisión independiente cerrada, gate presentado | DONE |
| T03 | Aprobar blueprint | Propietario | T02 | P0 | Aprobación explícita registrada sin confundirla con aprobación de deployment | DONE |
| T04 | Fijar tecnología y contratos | research_agent + atlas | T03 | P0 | Versiones estables/peer deps verificadas, mecanismo bootstrap y contrato auth schema cerrados antes scaffold | DONE |
| T05 | Crear base de app y DB de desarrollo | frontend_developer + database_architect + cicd_expert | T04 | P0 | App arranca, scripts y env.example; migraciones y constraints aplicados; typecheck/lint/build pasan | DONE |
| T06 | Registrar primer administrador y proteger sesiones | backend_developer + security_auditor | T05 | P0 | Provisionamiento privado atómico; signup público cerrado; login/logout/persistencia; requests sin membresía rechazados | REVIEW |
| T07 | Gestionar usuarios internos | backend_developer + frontend_developer | T06 | P0 | Admin crea/desactiva/cambia accesos; último admin protegido en concurrencia; sesiones revocadas; operador sin privilegios admin | REVIEW |
| T08 | Administrar clientes y filamentos | frontend_developer + backend_developer | T07 | P1 | CRUD validado, costo por gramo exacto; clientes/filamentos referenciados se archivan; historial comercial preparado; ranking financiero se cierra en T16 | REVIEW |
| T09 | Implementar cálculo único y cotizador | backend_developer + frontend_developer + test_generator | T08 | P0 | Multimaterial, h/m/s, energía, máquina, contingencia material, PP antes precios y multiplicadores editables; casos manuales y límites pasan | REVIEW |
| T10 | Guardar y versionar cotizaciones | backend_developer + frontend_developer | T09 | P0 | IDs únicos, draft/sent/accepted/rejected; duplicación limpia; snapshot congelado; edición enviada crea revisión | REVIEW |
| T11 | Descargar PDF cliente | frontend_developer + backend_developer | T10 | P1 | PDF desde revisión autorizada; precio elegido y datos correctos; tildes/textos largos/paginación; sin costos internos | REVIEW |
| T12 | Convertir y gestionar pedidos | backend_developer + frontend_developer | T10 | P0 | Conversión repetida/concurrente crea un pedido; tabla/cards, búsqueda/filtros/orden/paginación y transiciones auditadas | REVIEW |
| T13 | Registrar producción y costos reales | backend_developer + frontend_developer | T12 | P0 | Fallo y reimpresión en mismo pedido; costos reales separados estimados/reserva; completitud visible; pérdidas no duplicadas | REVIEW |
| T14 | Registrar anticipos y abonos | backend_developer + frontend_developer | T12 | P0 | Fecha/importe; saldo y estado derivados; doble envío/concurrencia sin sobrepago; caja una vez; sin devoluciones | REVIEW |
| T15 | Registrar gastos y egresos con origen | backend_developer + frontend_developer | T13,T14 | P0 | Categorías/responsable/filtros/CRUD auditado; compra material excluida OPEX; egreso único ligado al origen | REVIEW |
| T16 | Mostrar finanzas, dashboard y ranking de clientes | backend_developer + frontend_developer + analytics_reporter | T13,T14,T15 | P0 | Métricas compartidas, cohortes y caja explícitas; ranking/historial financiero de clientes con la misma fuente; utilidad provisional si costo incompleto; equilibrio casos sin base; charts y equivalentes textuales | REVIEW |
| T17 | Validar flujo completo y responsive | test_generator + uiux_designer | T11,T16 | P0 | E2E cotizar→convertir→fallar→reimprimir→abonar→entregar; permisos; móvil 360px/desktop; teclado/errores | IN_PROGRESS |
| T18 | Revisar seguridad y código, corregir | security_auditor + code_reviewer | T17 | P0 | Hallazgos evidenciados y cerrados; autor del cambio no es único verificador; dependencia/secretos/auth/financial checks | IN_PROGRESS |
| T19 | Validar build y documentar entrega | cicd_expert + doc_generator + nexus | T18 | P0 | Typecheck/lint/tests/integración/E2E/build; guía arranque, backup/recovery, env y deployment; status fiel a evidencia | IN_PROGRESS |

## Ejecución

Actualización UI 2026-10-03: T05 incluye inicialización shadcn/ui Base UI y configuración components.json después de T03/T04; T06 y módulos UI usan las composiciones, tokens y agentes/skills indicados en SHADCN_UI_PLAN. Skill oficial del framework instalada; componentes de aplicación generados desde shadcn/ui y utilizados en las pantallas. El estado REVIEW conserva pendiente la revisión y evidencia de QA de cada módulo.

El Orchestrator cambia TODO→IN_PROGRESS al comenzar, IN_PROGRESS→REVIEW al terminar el trabajo, REVIEW→DONE después de review/corrección/QA. Ante una dependencia bloqueante, cambia a BLOCKED con motivo, alternativa intentada y siguiente acción. No marcar pruebas/seguridad/build DONE por existir documentos de planificación.

T11 y T12 pueden ejecutarse en paralelo tras T10. T13 y T14 pueden avanzar por rutas separadas si respetan el contrato de pedido. T16 espera datos reales; no reemplaza módulos faltantes por tarjetas estáticas.
