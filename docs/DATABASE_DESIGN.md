# Modelo de datos implementado

Actualizado 2026-10-09. Fuente: [schema.ts](../src/lib/db/schema.ts) y [migraciones](../drizzle/). PostgreSQL con Drizzle; identificadores y relaciones por organización, versiones y auditoría.

## Entidades

| Grupo | Tablas principales | Función |
|---|---|---|
| Acceso | `user`, `session`, `account`, `verification`, `rate_limit` | Better Auth y límites de peticiones |
| Empresa | `organization`, `membership`, `business_settings`, `document_counter` | Empresa, roles, fórmula y consecutivos |
| Catálogo | `customer`, `filament` | Contactos y rollos, con archivo |
| Cotización | `quote`, `quote_revision`, `quote_material`, `quote_postprocess`, `quote_price_option`, `quote_image_asset` | Revisiones, snapshots, cantidad, fotos y totales |
| Pedido | `order`, `order_status_event`, `production_attempt` | Compra, evolución y reimpresión |
| Finanzas | `payment`, `expense`, `independent_loss`, `cash_movement` | Cobros, egresos y orígenes |
| Historial | `direct_cost`, `audit_event`, `mutation_request` | Costos históricos, auditoría e idempotencia |

Los nombres y columnas definitivos se consultan en el esquema; esta tabla no sustituye sus constraints.

## Cardinalidad y snapshots

Una cotización tiene varias revisiones; una revisión conserva materiales, acabados, fórmula, entradas y precio. Cliente opcional para cotizar, obligatorio al confirmar pedido. Teléfono del cliente opcional.

Una cotización/revisión aceptada puede generar varios pedidos del mismo cliente o de clientes distintos. No existe restricción única por fuente ni por fuente/cliente. Se conserva índice no único `order_source_quote_customer_idx` para consulta. La FK de pedido liga organización, fuente y revisión aceptada.

`quote_revision.quantity` admite 1–10000 y default 1. La revisión guarda `print_seconds`, gramos y acabados totales; `formula_snapshot.inputSnapshot` conserva datos por pieza. No multiplicar las columnas totales otra vez al mostrar o editar.

El pedido conserva precio acordado, referencia de revisión, override opcional de costo, fechas, estado, versión y `archived_at`. El costo vigente se deriva de revisión/override; `direct_cost` no reemplaza esa base.

## Integridad y mutaciones

Los comandos bloquean registros y validan versiones donde corresponda. `mutation_request` identifica organización, actor, operación y key con hash de entrada. Reutilizar key con otro payload produce conflicto; no impedir compras nuevas mediante una unicidad comercial artificial.

Pagos válidos reducen saldo; pagos y movimientos de caja se preservan al archivar pedido. Archivo es lógico y auditado; borrado físico tiene condiciones específicas de entidad sin historial. Cerrar exige entrega y saldo cero en el servicio.

Dinero contractual en COP enteros; componentes y precios por gramo con precisión decimal. Duración en segundos; fechas civiles PostgreSQL `date`, eventos con timestamp. Nunca acumular dinero desde texto formateado.

## Migraciones incluidas

El journal incluye `0000` a `0008`. Cambios recientes relevantes:

- [0007](../drizzle/0007_dark_trauma.sql): cantidad de revisión, default 1 y check 1–10000.
- [0008](../drizzle/0008_tan_invisible_woman.sql): elimina unicidad cotización/cliente y crea índice no único.

Las migraciones anteriores y snapshots permanecen en `drizzle/`. Tener el archivo en Git no prueba su aplicación en una base concreta. Ejecutar el migrador con conexión privada directa y consultar su resultado antes de desplegar código dependiente.

## Operación y límites

Usar bases separadas para desarrollo, pruebas y producción. No ejecutar fixtures destructivos en Neon del negocio. Respaldo/restauración, rol runtime mínimo y aislamiento de previews necesitan verificación explícita; consultar [OPERATIONS](OPERATIONS.md).

## Imágenes de cotización — 2026-10-10

Migración 0009: `quote_image_asset` conserva JPEG privados optimizados, dimensiones y autor/organización. `quote_revision.images` guarda hasta 10 referencias ordenadas y sus títulos; también se conservan en `formula_snapshot.inputSnapshot`. Los duplicados comparten archivos inmutables, con títulos independientes por revisión. Ver [QUOTE_IMAGES](QUOTE_IMAGES.md).
