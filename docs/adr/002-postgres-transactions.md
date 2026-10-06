# ADR-002 — PostgreSQL interactivo como autoridad transaccional

Fecha: 2026-10-02 · Decisores: propietario/equipo técnico (pendiente).

## Status

Proposed; seguimiento un mes tras aceptación mediante registro independiente, sin editar ADR aceptado.

## Context

Dos abonos paralelos pueden superar saldo, dos conversiones duplicar venta y dos bootstraps reclamar propietario. La integridad no puede depender de UI, memoria efímera ni secuencias count/max. Neon y Vercel requieren conexiones controladas; Drizzle admite SQL de bloqueo.

## Decision

Usar Drizzle sobre pg/TCP pooled TLS, transacciones cortas READ COMMITTED en un mismo cliente y locks explícitos de aggregates; constraints únicas/FK/CHECK como segunda garantía. Runtime usa pool pequeño por instancia y rol mínimo; migraciones endpoint directo y rol separado. Idempotencia persistida con hash/actor/operación y resultado en el mismo commit; reautorizar al devolver resultado previo.

## Alternatives Considered

| Opción | Pros | Cons | Resolución |
|---|---|---|---|
| pg/TCP pooled con locks y constraints | Interactividad SQL, control explícito, tooling conocido | Conexiones por instancia y deadlocks requieren disciplina; timeout/pool tuning | Elegida para consistencia y mantenimiento local |
| Driver HTTP con lotes no interactivos | Menos gestión de sockets, adecuado a consultas independientes | No satisface read→lock→decision→write interactivo según este diseño | Rechazada en escrituras; no añadir segundo transporte sin beneficio medido |
| Neon WebSocket interactivo | Transacciones compatibles serverless y runtimes variados | Driver/configuración extra sin necesidad Edge | Viable pero no elegido: pg simplifica Node; revisable sin cambiar dominio |
| SERIALIZABLE para toda operación | Detecta anomalías amplias sin diseñar cada lock | Más reintentos/abortos; no reemplaza uniques ni idempotencia | Rechazada como default; usar por operación si pruebas revelan anomalía no cubierta |

## Consequences

Positivo: saldo, caja, pedido único y bootstrap tienen commit coherente. Negativo: lock ordering y conexiones se vuelven responsabilidad operativa; ejecutar red externa bajo lock produciría latencia/agotamiento. Neutral: DB es autoridad incluso si frontend ya validó; código agregado soporta reintentos tipados.

## Implementation Plan

Migraciones versionadas y reproducibles en DB vacía/preview; wrapper transaccional transmite mismo tx a colaboradores y libera en finally. Usar order→child y contador al final; acquire advisory_xact_lock para bootstrap/último admin. Sin llamadas auth/PDF externas durante tx. Rollback de despliegue no elimina ledger; cambios destructivos esperan restore probado. Registrar deadlocks/timeouts por código sin SQL/PII.

## Fitness checks

Integración contra PostgreSQL real: dos pagos que exceden saldo no pueden ambos confirmar; conversión repetida retorna mismo pedido; caída antes de commit deja cero filas parciales; key/payload distinto conflict; IDs ajenos fallan. Verificar que BEGIN/COMMIT usan mismo cliente y que locks no son session-scoped. Estas pruebas están planificadas, no ejecutadas.

## References

[DATABASE_DESIGN](../DATABASE_DESIGN.md), [API_DESIGN](../API_DESIGN.md), [TECHNOLOGY_STACK](../TECHNOLOGY_STACK.md). Fuentes oficiales trazadas allí: [node-postgres transactions](https://node-postgres.com/features/transactions), [Drizzle transactions](https://orm.drizzle.team/docs/transactions).
