# Equipo y coordinación — actualización 2026-10-09

Los nombres siguientes constan en el contexto del proyecto y/o documentos históricos. Esta tabla define responsabilidades reutilizables; no atribuye cambios concretos sin evidencia ni indica agentes activos actualmente.

| Rol | Contrato |
|---|---|
| Principal / orquestador | Alcance, permisos, dependencias, integración, validación y comunicación |
| atlas | Arquitectura, cardinalidades, contratos y ADR |
| database_architect | Modelo de datos e integridad |
| db_implementation | Implementación de esquema, persistencia y migraciones |
| access_backend | Sesión, permisos y reglas del servidor |
| frontend_developer | Componentes, interacción, estilos y accesibilidad |
| frontend_app | Integración de pantallas y recorridos de usuario |
| code_reviewer | Revisión independiente con evidencia |
| delivery_documentation | Estado, guías de uso, operación y límites de entrega |

Los agentes históricos adicionales del blueprint y rediseño se conservan en el registro inferior. Los perfiles reutilizables están documentados en el proyecto hermano `codex-framework`; no forman parte automáticamente de la configuración de esta aplicación.

## Reglas operativas

Delegar solo con autorización del usuario o instrucciones aplicables. Asignar objetivo, entradas, archivos exclusivos, dependencias, criterios y verificación. Paralelizar tareas independientes; serializar migraciones, lockfiles, archivos compartidos e integración. En workspace compartido, los agentes ven los mismos archivos.

El principal verifica el resultado agregado; un subagente finalizado no demuestra una tarea terminada. Cada responsable devuelve cambios, pruebas realmente ejecutadas y pendientes. No ampliar permisos ni iniciar delegaciones anidadas sin autorización. La autorización anterior persiste en su alcance, incluida publicación ya solicitada; preparar resultado revisable antes de pedir aprobación que falte.

---

## Registro histórico del blueprint y sus revisiones

# Orquestación del blueprint

Fecha: 2026-10-02. Orchestrator: nexus; modo documental hasta aprobación del blueprint. Objetivo: convertir la solicitud completa y las respuestas confirmadas en un diseño ejecutable, revisado e integrado. Prohibido implementar/scaffold antes de aprobación; sin crear agentes/skills nuevos, contratar servicios o desplegar.

## Recursos, contratos y dependencias

| Recurso existente | Tarea | Inputs | Output esperado | Dependencias | Review requerido / completion |
|---|---|---|---|---|---|
| nexus | Coordinar intake, integración, plan, estado y gate | Fuente operador, AGENTS, INVENTORY, workflows y entregables | Docs coherentes, contrato por especialista, resumen/gate | Todas las ramas | No declaración ready hasta cierre de hallazgos/revisiones |
| scribe | Consolidar brief/discovery, REQ/CFR/AC/SC, PRD y ledger | 24 secciones y respuestas operador | Cinco artefactos factuales/trazables | Contratos _common restaurados; negocio respondido | Integración nexus y revisión de verificabilidad; fuente confirmada separada de propuestas |
| research_agent | Seleccionar stack mínimo y verificar fuentes vigentes | Restricciones Next/BetterAuth/Neon/Vercel y datos monetarios | TECHNOLOGY_STACK, RESEARCH | Discovery | Compatibilidad, costes y transacciones justificados; sin instalación ni benchmarks inventados |
| database_architect | Modelo relacional e integridad dinero/trazabilidad | Requisitos/fórmulas/stack y fuente financiera | DATABASE_DESIGN | Fórmula/PP confirmados | Revisión independiente de locks, unique, origen caja y no doble pérdida |
| atlas | Arquitectura, interfaces y ADRs | Stack, datos, requisitos y reglas financieras | ARCHITECTURE, API_DESIGN, ADRs propuestos | Contratos estables y ramas anteriores | architecture-review fresh; opciones/consecuencias/fitness checks; no código |
| uiux_designer | Flujos/admin responsive accesible | PRD, roles, estado/pagos/cotizador/PDF | UX_PLAN | Negocio y métricas definidos | Revisión de flujos verificables y consistencia; buscar evidencia con frontend-design-pro |
| code_reviewer | Review independiente de arquitectura/contratos | Conjunto completo de blueprint y workflow | Hallazgos con severidad/evidencia y verdict | Borradores de todas las ramas | No escribió propuesta; lectura solamente; sin delegación; cierre antes gate |
| security_auditor | Revisar superficie auth/PII/permisos/secretos prevista | Blueprint auth/API/DB | Hallazgos y criterios de prueba seguridad | Arquitectura consolidada | Gate de diseño, sin afirmar runtime seguro |
| test_generator | Revisar verificabilidad y auditoría de cálculos planificada | Requisitos/AC/ledger/finanzas/API/UX | QA_PLAN y hallazgos de aceptación | Contratos consolidados | Casos adversos/esperados independientes; sin ejecutar tests de entrega antes aprobación |

Las revisiones documentales de code_reviewer, security_auditor y test_generator fueron completadas y sus resultados quedan en REVIEW_REPORT.md. La revisión de la aplicación real se ejecutará después de implementación; no se deduce seguridad o calidad runtime de la revisión del blueprint.

## Routing y autoridad

Actualización 2026-10-03: el propietario solicita un plan explícito de qué/cómo/agentes. project_manager revisó en una sesión real de solo lectura la secuencia y los criterios de entrega. Sus recomendaciones se incorporan en IMPLEMENTATION_PLAN y TASKS: ranking financiero cierra en T16, cálculo puro puede prepararse con T08 y QA/revisión acompañan cada hito. El equipo y sus asignaciones por etapa están detallados en IMPLEMENTATION_PLAN. No se inició implementación ni se alteró el gate de aprobación.

Extensión solicitada 2026-10-03: skill oficial `shadcn` importada al framework y registrada en INVENTORY/SOURCES. frontend_developer produjo SHADCN_UI_PLAN documental y usará la skill en implementación; uiux_designer aplica diseño/branding y revisa accesibilidad, con frontend-design-pro. code_reviewer revisa integración real tras scaffold. No se inventa un agente ejecutor «shadcn»: agents/openai.yml del paquete oficial es metadata. Registry @shadcn y Base UI explícitos en blueprint; sin componentes.json ni componentes generados antes de aprobación.

Ramas independientes iniciales: especificación, investigación técnica y modelo conceptual. Ramas dependientes: arquitectura/API y UX después de reglas/stack/modelo. Revisión independiente tras borradores completos. Cada rama tiene archivos exclusivos; el orquestador integra correcciones necesarias con aviso al productor/revisor.

Runtime: herramienta nativa collaboration para sesiones reales, con máximo tres especialistas activos junto al orquestador. Sin procesos externos que omitan permisos. Se hereda modelo del host; las etiquetas históricas de modelos en TOML no se traducen a modelos inexistentes del runtime.

Confianza de routing: alta para app web administrativa y documentación; no se seleccionan especialistas físicos CAD/impresión porque el entregable no diseña ni controla impresoras. No se simula un contador fiscal: fórmulas comerciales y métricas operativas propuestas se presentan al propietario.

## Evidencia y gates

- _common nexus/scribe/atlas: reparación de copia exacta con hashes en FRAMEWORK_REPAIR, fuente intacta.
- Stack: fuentes oficiales enlazadas y fecha de consulta; compatibilidad de paquetes se comprueba al fijar versiones tras aprobación.
- Aritmética de ejemplo: cálculo independiente PowerShell decimal dio costos 12065.541666... y precios finales 24131/30164/36197 COP; es verificación del ejemplo, no test del software.
- Trazabilidad: ledger documental no se convierte en cobertura de código. Estados NOT_TESTED hasta evidencia real posterior.
- Approval gate: solo después de review cerrado, PROJECT_STATUS WAITING_FOR_BLUEPRINT_APPROVAL y resumen BLUEPRINT READY FOR REVIEW.
- Delivery futuro: implementación, revisión, typecheck/lint/tests/build y documentación reales antes de COMPLETE.
