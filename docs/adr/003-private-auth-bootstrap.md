# ADR-003 — Identidad privada y bootstrap único atómico

Fecha: 2026-10-02 · Decisores: propietario/equipo técnico (pendiente).

## Status

Proposed; revisar un mes después de aceptar en registro separado. Sin cuenta creada ni contraseña almacenada durante blueprint.

## Context

Primer usuario administra una única empresa; no habrá registro público. Better Auth posee identidad/session/account, pero API auth y transacciones de negocio independientes no garantizan atomicidad conjunta. Un count(users) seguido de signup crea carrera y autoridad indebida. Credenciales y datos comerciales necesitan una frontera verificable.

## Decision

Provisionar primer administrador mediante CLI privado: hash oficial de versión Better Auth fijada y schema auth generado/revisado; un cliente pg y advisory lock transaccional crean singleton organization, user/account credential, membership administrator, settings/counters y bootstrap_completed_at juntos. Signup público off desde inicio. Altas normales via Better Auth admin y membership activa; identidad huérfana no accede a negocio. Política empresarial server-side controla roles/último admin incluso frente a endpoints auth directos.

## Alternatives Considered

| Opción | Pros | Cons | Resolución |
|---|---|---|---|
| CLI privado, hash oficial y transaction única | Sin superficie anónima; rollback/concurrencia garantizables | Acopla schema provisionamiento a versión auth; exige smoke login y runbook | Elegida; bloquear implementación si versión rompe contrato |
| Ruta web first-user con count y hook auth | UX de onboarding fácil | Carrera, exposición pública y commits independientes; difícil reclamación legítima | Rechazada: no satisface bootstrap atómico |
| Proveedor identidad externo e invitaciones | Operación de identidad delegada y recuperación completa | Nuevo proveedor/coste/cuenta, onboarding más complejo; usuario pidió Better Auth | Rechazada para MVP; evaluable ante necesidad real |

## Consequences

Positivo: instalación y autoridad inicial indivisibles, cero registro no autorizado; membership gobierna negocio. Negativo: operador técnico necesita acceso privado inicial y recuperación; alta normal necesita compensación si falla asociación. Neutral: admin/user auth se mapean a administrator/operator negocio; roles distintos no crean multiempresa.

## Implementation Plan

Fijar releases auth/adaptador/CLI compatibles, generar schema y demostrar hash/account login en integración antes de bootstrap real. Ejecutar CLI manualmente con entrada privada sin argumentos/logs de contraseña. Probar fallo/rollback y concurrencia; no ejecutar bootstrap en build. Alta normal: identidad→membership auditada; asociación fallida revoca sesiones/deniega negocio y retorna fallo reparable. Desactivación cambia membership y revoca sesiones; lock común impide perder último admin. No proveedor email ni impersonación; recuperación admin privada auditada. Rollback auth requiere schema compatible y conserva identidad; nunca reabrir signup para resolver falla.

## Fitness checks

Dos bootstrap concurrentes producen exactamente un administrator y singleton; fallo tras user/account revierte todos. Login reconoce hash generado. Signup directo denegado; operador no usa rutas admin; generic ban/change-role no esquiva último admin. Identidad sin membership y sesiones revocadas/inactivas no leen negocio. No passwords/secrets en logs/DTO.

## References

[ARCHITECTURE](../ARCHITECTURE.md), [DATABASE_DESIGN](../DATABASE_DESIGN.md), [TECHNOLOGY_STACK](../TECHNOLOGY_STACK.md), [Better Auth admin](https://better-auth.com/docs/plugins/admin), [email/password](https://better-auth.com/docs/authentication/email-password). Sources/version evidence y patches finales están delegados a TECHNOLOGY_FINALIZATION antes de scaffold.
