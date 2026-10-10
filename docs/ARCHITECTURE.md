# Arquitectura implementada

Actualizada 2026-10-09; referencia `5cb394a`. Monolito Next.js App Router, React y TypeScript; Node para PostgreSQL, Better Auth y PDF. Producción publicada previamente en Vercel con Neon.

## Estructura real

| Ubicación | Responsabilidad |
|---|---|
| [src/app](../src/app/) | Rutas, layouts, Server Actions y handlers |
| [src/components](../src/components/) | Pantallas, formularios, navegación y UI shadcn/Base UI |
| [app-service.ts](../src/lib/app-service.ts) | Entrada a comandos y consultas de módulos |
| [access.ts](../src/lib/access.ts), [auth.ts](../src/lib/auth.ts), [users.ts](../src/lib/users.ts) | Sesión, membresía, permisos y usuarios |
| [mutations.ts](../src/lib/mutations.ts) | Transacción, revalidación de acceso e idempotencia |
| [catalog-service.ts](../src/lib/catalog-service.ts) | Clientes, filamentos y ajustes |
| [quote-service.ts](../src/lib/quote-service.ts) | Revisiones, conversión, ajustes y archivo de pedidos |
| [production-service.ts](../src/lib/production-service.ts) | Intentos, entrega, cierre, pagos, gastos y pérdidas |
| [finance.ts](../src/lib/finance.ts) | Cálculo decimal puro del cotizador |
| [reporting.ts](../src/lib/reporting.ts) | Agregaciones SQL de operación y finanzas |
| [quote-pdf.ts](../src/lib/quote-pdf.ts) | PDF comercial autorizado |
| [src/lib/db](../src/lib/db/) y [drizzle](../drizzle/) | Conexión, esquema y migraciones |

La propuesta inicial de carpetas `features/*` no describe la implementación actual: los servicios están en `src/lib`. No crear carpetas o abstracciones vacías solo para igualar el blueprint.

## Flujo

Navegador → Server Action → contexto autenticado → servicio → transacción → PostgreSQL → DTO serializado → actualización de la UI. Los Server Components llaman servicios del servidor; no necesitan una API REST interna adicional.

El servidor valida organización, rol, datos y versiones. La mutación revalida sesión/membresía dentro de la transacción antes de consultar resultados idempotentes. Las lecturas financieras agregadas se restringen al administrador.

Cotizaciones conservan snapshots unitarios, totales y revisión. Un pedido referencia la revisión aceptada; una cotización admite varios pedidos. La misma key idempotente repite una operación; una nueva key expresa una compra nueva.

## Invariantes

- Costo y ganancia del pedido proceden de cotización/override, sin registro adicional obligatorio.
- Pagos y caja se escriben junto con auditoría; sobrepagos y cierres impagos se rechazan.
- Archivo comercial no borra efectivo recibido.
- Fechas civiles y límites de períodos usan Colombia.
- PDF solo recibe información comercial; sin costos o notas privadas.
- Formularios de creación se limpian después de éxito; errores preservan entradas.
- Filtros y navegación interna deben preservar contexto según sus componentes.
- La UI no sustituye la autorización del servidor.

## Acceso y operación

Roles empresariales: administrador y operador; Better Auth mantiene identidades y sesiones, y la membresía empresarial determina permisos. Bootstrap privado inicializa una sola empresa y su administrador. Signup público cerrado. La protección adicional de Vercel es independiente del login de Golden Print.

Para expiración, env y despliegue, consultar [OPERATIONS](OPERATIONS.md). La documentación no certifica que roles DB, previews aislados, backups o observabilidad propuestos estén configurados.

ADRs originales: [001](adr/001-modular-monolith-node.md), [002](adr/002-postgres-transactions.md), [003](adr/003-private-auth-bootstrap.md), [004](adr/004-financial-core-snapshots.md). [ADR 005](adr/005-commercial-workflow-evolution.md) documenta cambios posteriores que sustituyen unicidades y costos del diseño inicial.
