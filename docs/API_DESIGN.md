# Contratos implementados

Actualizado 2026-10-09. La aplicación usa Server Actions para comandos y servicios directos para lectura; no existe una API REST CRUD pública equivalente al contrato hipotético del blueprint.

## Entradas

- [actions.ts](../src/app/actions.ts): `action(command, input)`.
- [app-service.ts](../src/lib/app-service.ts): autorización, routing de comandos y consultas.
- [mutations.ts](../src/lib/mutations.ts): idempotencia transaccional de comandos del negocio.
- Handler de Better Auth y handler de PDF: ver rutas en [src/app](../src/app/).

Respuesta de acción:

```text
éxito: { ok: true, data, requestId }
fallo: { ok: false, error: { code, message, fieldErrors? }, requestId }
```

Los esquemas Zod de cada servicio son la fuente exacta de campos. El envoltorio actual no transmite automáticamente todos los metadatos propuestos originalmente, como `currentVersion`.

## Comandos principales

| Familia | Operaciones relevantes | Servicio |
|---|---|---|
| `customers.*`, `filaments.*`, `settings.update` | Crear/editar/archivar catálogo; fórmula administradora | `catalog-service.ts` |
| `quotes.*` | Crear, editar, duplicar, emitir, aceptar/rechazar, archivar y borrar borrador sin uso | `quote-service.ts` |
| `orders.convertQuote` | Crear nueva compra o vincular provisional explícito | `quote-service.ts` |
| `orders.createIntake`, `updateMetadata`, `updateCommercial`, `archive`, `deleteUnusedIntake` | Alta provisional, datos, ajuste y eliminación | `quote-service.ts` |
| `production.*` | Inicio, finalización, fallo, reimpresión y compatibilidad con costos históricos | `production-service.ts` |
| `orders.transition`, `updateDeliveryDate`, `close` | Entrega, corrección antes de cierre y cierre pagado | `production-service.ts` |
| `payments.create`, `settleBalance`, `correct` | Abono, saldo restante y corrección | `production-service.ts` |
| `expenses.*`, `losses.*`, `cash.correctDirectOut` | Gastos, pérdidas y correcciones | `production-service.ts` |
| `users.*` | Nombre, alta, rol, acceso y contraseña | `users.ts` por routing propio |

La tabla es orientativa: no invocar operaciones deducidas por nombre sin revisar el esquema real.

## Creación repetida de pedidos

`orders.convertQuote` recibe `quoteId`, `acceptedRevisionId`, `expectedVersion`, `customerId`, `idempotencyKey` y opcionalmente `existingIntakeId`. La revisión debe estar aceptada y el cliente activo.

Sin provisional explícito, crea un pedido nuevo. Un nuevo UUID de operación permite otra compra con la misma cotización y cliente. La misma key y payload devuelve el resultado anterior; otra entrada con esa key produce `IDEMPOTENCY_CONFLICT`.

## Cierre y archivo

`orders.close` requiere pedido, versión y `confirmClose: true`; valida estado entregado y saldo cero. Pendiente de pago devuelve `PAYMENT_PENDING`.

`orders.archive` requiere administrador, pedido, versión, motivo y key. Admite cerrado; registra archivo y auditoría. Lecturas y mutaciones normales excluyen archivados. No borra ni anula pagos.

## Auth, PDF y errores

Auth permite rutas explícitas para login/logout/sesión y operaciones propias; endpoints públicos de registro y administración genérica se bloquean en el handler. La autoridad empresarial procede de membresía activa y se comprueba en servidor.

PDF exige acceso y relación correcta entre cotización/revisión. Usa datos comerciales guardados y recursos locales; no incluye fórmula, costos ni notas internas.

Errores relevantes: `UNAUTHENTICATED`, `FORBIDDEN`, `VALIDATION_ERROR`, `NOT_FOUND`, `VERSION_CONFLICT`, `IDEMPOTENCY_CONFLICT`, `INVALID_TRANSITION`, `ORDER_CLOSED`, `PAYMENT_PENDING`, `PAYMENT_EXCEEDS_BALANCE`. No asumir que el mensaje del navegador implica rollback de una petición cuyo resultado no pudo recibirse: reintentar con la misma identidad de operación.
