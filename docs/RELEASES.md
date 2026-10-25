# Cambios relevantes

Actualizado 2026-10-09 desde el historial Git local. Las referencias indican implementación en código; no certifican por sí solas un despliegue ni modificaciones actuales de datos.

| Commit | Cambio |
|---|---|
| `5cb394a` | Filtros de cotizaciones mediante navegación cliente y conservación de scroll |
| `db4bfaa` | Eliminación administrativa de pedidos con motivo mediante archivo; exclusión de reportes activos |
| `21c5de7` | Pedidos repetidos desde una cotización para cualquier cliente; migración 0008 |
| `b60c139` | Muestras de filamentos multicolor mediante franjas |
| `5e2ac5b` | Color Madera |
| `71fcc4c` | Cantidad de piezas, multiplicación de entradas y totales; migración 0007 |
| `51b407c` | Resumen de gramos y tiempo en pedidos recientes |
| `923cbe2` | Barra Cobrado junto a ventas entregadas en Finanzas |
| `fa6befc` | Estado Cerrado violeta para diferenciarlo de Entregado |
| `caa9f2a` | Cierre junto a fecha real de entrega, sin tarjeta duplicada de cliente |
| `fb8d598` | Evolución inicial de compras de una cotización por clientes diferentes, ampliada por 21c5de7 |
| `b6e7365` | Saldo acumulado de caja en Inicio |

## Actualización documental

Se sincronizaron guías de uso, estado, finanzas, arquitectura, datos, contratos, operación y requisitos vigentes. Se preservaron documentos reemplazados y planes históricos. Se comprobaron enlaces, comandos, migraciones y ejemplos del calculador. No se cambió código de aplicación ni se ejecutaron correcciones de datos o despliegues como parte de esta actualización.

Para futuras entregas registrar commit, pruebas ejecutadas/resultados, entorno, ID/URL del despliegue y limitaciones. Las correcciones de datos se documentan privadamente sin PII en el changelog.

## Imágenes de cotización — 2026-10-10

Hasta 10 fotos privadas por revisión, cada una con título editable, miniatura y opción de quitar. Las imágenes se conservan en edición/duplicado y se incluyen en el PDF comercial con paginación. Migración 0009, dependencia Sharp fijada y validación de acceso/límites en servidor. Pruebas y restricciones en [VALIDATION_REPORT](VALIDATION_REPORT.md); diseño y mantenimiento en [QUOTE_IMAGES](QUOTE_IMAGES.md).

## Gastos de empresa y personales — 2026-10-11

Selector de origen del dinero en creación y corrección, identificación del pagador en el listado y detalle. Solo Empresa descuenta caja; los gastos operativos personales conservan su efecto en utilidad. Migración aditiva 0010 con compatibilidad histórica. Publicación identificable por el SHA de esta entrega en Git/Vercel.

## Detalle del cliente — 2026-10-12

Ficha propia con contacto, notas, resumen comercial real, pestañas de historial enlazado, acceso a WhatsApp y edición lateral adaptable a celular. Se conserva la actualización con versión y el archivo existente. Cotizaciones muestran proyecto, fecha comercial y estado de la revisión actual; historial activo excluye archivos.

## Búsqueda de pedidos — 2026-10-12

Buscar usa next/form con navegación de aplicación, conserva scroll, estado, vista y orden; reinicia la paginación. Limpiar y paginar también conservan scroll. El campo se sincroniza con la URL al navegar atrás/adelante.

## Finanzas por meses — 2026-10-12

Accesos Este mes y Mes pasado, más vista Comparación mensual con dos meses seleccionables, gráfica de barras y tabla de diferencias en COP/porcentaje. Identifica el mes actual incompleto y rechaza meses futuros o inválidos. Cambios de período y comparación usan navegación sin recarga completa.

## Pedidos con precio cero — 2026-10-12

El detalle solo calcula el porcentaje recibido cuando el precio es estrictamente mayor que cero. Decimal.isPositive también considera positivo el cero y provocaba 0/0 → NaN al abrir pedidos gratuitos. El cambio de visualización conserva precios, costos y pagos.

## Resumen de cotización — 2026-10-13

El resumen separa Electricidad y Desgaste de impresora, usando los costos de energía y máquina ya calculados. Conserva la duración estimada y todos los totales; no modifica fórmulas ni datos guardados.

## Edición de gastos y proyecciones — 2026-10-14

Botón Editar en filas y tarjetas de gastos, enlace directo al formulario y guardado con motivo e historial. Nueva vista Proyecciones y equilibrio con histórico de seis meses, proyección del mes actual, tres meses estimados, gráfica, meta y avance mensual. Reutiliza costos financieros existentes; no requiere migración.

## Gastos por pagador — 2026-10-25

Nueva pestaña Por usuario y empresa con totales por origen del dinero para todo el período, desglose operativo/material, porcentaje y número de registros. Incluye usuarios sin gastos, excluye anulados y usa navegación sin recarga completa al cambiar pestaña o fechas. No requiere migración ni modifica registros existentes.

## Gráfica de gastos por pagador — 2026-10-25

La pestaña Por usuario y empresa incluye barras por pagador, separando gastos operativos y compras de material. La gráfica usa los mismos totales de las tarjetas y responde al período seleccionado. Mantiene cifras exactas en el desglose y en el tooltip.
