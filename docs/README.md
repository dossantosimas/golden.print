# Índice de documentación

Actualizado: 2026-10-09. Código de referencia: `5cb394a`.

## Guías vigentes

| Documento | Para qué sirve |
|---|---|
| [USER_GUIDE](USER_GUIDE.md) | Operación diaria por módulo |
| [PROJECT_STATUS](PROJECT_STATUS.md) | Estado, alcance y siguiente paso |
| [REQUIREMENTS](REQUIREMENTS.md) | Requisitos actuales y requisitos históricos con IDs |
| [FINANCIAL_RULES](FINANCIAL_RULES.md) | Cantidades, costos, cobros, cartera y caja |
| [ARCHITECTURE](ARCHITECTURE.md) | Estructura real y límites |
| [DATABASE_DESIGN](DATABASE_DESIGN.md) | Modelo implementado y migraciones |
| [API_DESIGN](API_DESIGN.md) | Server Actions, comandos y handlers existentes |
| [OPERATIONS](OPERATIONS.md) | Configuración, migraciones, publicación y recuperación |
| [ORCHESTRATION](ORCHESTRATION.md) | Roles y coordinación |
| [RELEASES](RELEASES.md) | Cambios trazables por commit |
| [TASKS](TASKS.md) | Trabajo vigente y plan original conservado |
| [IMPROVEMENTS](IMPROVEMENTS.md) | Pendientes priorizados sin afirmar ejecución |
| [MAINTENANCE](MAINTENANCE.md) | Continuidad, lecciones y flujo de cambio |
| [VALIDATION_REPORT](VALIDATION_REPORT.md) | Evidencia fechada y límites de verificación |

## Diseño y evidencia histórica

[PROJECT_BRIEF](PROJECT_BRIEF.md), [DISCOVERY](DISCOVERY.md), [PRD](PRD.md), [BLUEPRINT](BLUEPRINT.md), [IMPLEMENTATION_PLAN](IMPLEMENTATION_PLAN.md), [TECHNOLOGY_STACK](TECHNOLOGY_STACK.md), [UX_PLAN](UX_PLAN.md), [QA_PLAN](QA_PLAN.md) y [RESEARCH](RESEARCH.md) conservan la etapa en que se escribieron. Un estado “propuesto”, “NOT_TESTED” o “no desplegado” dentro de ellos no describe automáticamente la versión actual.

[AUTH_IMPLEMENTATION](AUTH_IMPLEMENTATION.md), [DB_IMPLEMENTATION](DB_IMPLEMENTATION.md), [SECURITY_REVIEW](SECURITY_REVIEW.md), [IMPLEMENTATION_REVIEW](IMPLEMENTATION_REVIEW.md) y [REVIEW_REPORT](REVIEW_REPORT.md) conservan evidencia de su revisión; no equivalen a una nueva auditoría.

Los documentos reemplazados en esta actualización se conservan en [historial documental](history/2026-10-09-pre-update/README.md). Los ADR originales permanecen; la evolución de cardinalidad, costos y archivo se registra en [ADR 005](adr/005-commercial-workflow-evolution.md).

## Cómo mantener estos documentos

Actualizar el documento dueño de la regla y enlazarlo desde los demás. Registrar fecha, commit, evidencia ejecutada y limitaciones. No copiar contraseñas, tokens, conexiones privadas ni datos personales. Las correcciones puntuales de producción requieren registro privado y auditable; no convertir nombres o saldos del negocio en ejemplos públicos.
