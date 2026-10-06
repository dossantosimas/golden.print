# ADR-001 — Monolito modular en Node con funcionalidades verticales

Fecha: 2026-10-02 · Decisores: propietario y equipo técnico (aprobación pendiente).

## Status

Proposed. Aceptación sujeta a gate del blueprint; revisión de resultados un mes después de aceptación, registro de seguimiento separado. ADR aceptado será inmutable.

## Context

Un negocio necesita cotizaciones, producción y dinero consistentes, con equipo/volumen aún sin medir. Usuario requiere Next/Neon/Vercel. Las reglas cruzan varios módulos, pero no existen requisitos de escala o cumplimiento independientes. El default híbrido atlas combina edge, containers y serverless; añadir esos tiers aquí introduce sesiones, despliegues y fallos distribuidos antes de disponer de demanda que los justifique.

## Decision

Organizar Next como monolito modular por funcionalidades verticales y desplegar CRUD/auth/PDF en runtime Node Vercel. Exponer interfaces de aplicación internas para reutilizar comandos y consultas; dominio financiero puro. Mantener infraestructura server-only y restricciones de import; CDN únicamente para recursos estáticos.

## Alternatives Considered

| Opción | Pros | Cons | Resolución |
|---|---|---|---|
| Monolito modular Node | Una transacción/observabilidad/deployment; refactor local; SQL compartido | Escala conjuntamente; límites requieren controles; acoplamiento puede crecer | Elegida: menor carga operativa y coherencia financiera |
| Híbrido Edge+container+serverless | Tiers especializados, trabajos largos posibles, independencia de recursos | Tres operaciones, identidad/contratos distribuidos, gasto y diagnósticos adicionales | Rechazada ahora: no trabajo largo ni escala independiente; reconsiderar con evidencia |
| Microservicios por dominio | Escala/ownership independientes y libertad tecnológica | Dinero entre servicios exige protocolos, colas y recuperación; peor mantenimiento para negocio pequeño | Rechazada: coste de consistencia excede beneficio actual |

## Consequences

Positivo: flujo end-to-end y reglas financieras consistentes; facilidad de desarrollo y recuperación. Negativo: despliegue afecta módulos juntos y funciones Vercel tienen límites; una funcionalidad prolongada podría exigir worker en el futuro. Neutral: no REST público ni procesos distribuidos hasta requisito real; el usuario obtiene las mismas funciones de negocio.

## Implementation Plan

Implementar slices auth→catálogos→quotes→orders/production→payments/expenses→reporting tras aprobación. Comandos aceptan contexto transaccional explícito. Rollback por release anterior compatible; migrar schema con expand/contract si existen datos. Extraer worker solo ante operación medida que exceda tiempo/memoria disponible, conservando contrato y evitando duplicar reglas.

## Fitness checks

CI debe detectar cero ciclos entre features, cero imports client→DB/auth y cero financial-core→Next/ORM/features; insertar violación de prueba para demostrar que el check falla. Warning inicial Ce>=10 o profundidad>=5 solicita revisión. No hay medición baseline todavía; test de bundle/build Node comprueba viabilidad del tier.

## References

[ARCHITECTURE](../ARCHITECTURE.md), [TECHNOLOGY_STACK](../TECHNOLOGY_STACK.md), [REQUIREMENTS](../REQUIREMENTS.md). Default/fitness: framework atlas/SKILL.md y reference/coupling-metrics.md, leídos localmente.
