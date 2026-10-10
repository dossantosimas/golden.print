# Reglas financieras y cotizador

Vigente al 2026-10-09, contrastado con [finance.ts](../src/lib/finance.ts), [reporting.ts](../src/lib/reporting.ts), [quote-service.ts](../src/lib/quote-service.ts) y [production-service.ts](../src/lib/production-service.ts). COP, America/Bogota, sin impuestos ni devoluciones.

## Cantidad y cálculo

Cantidad entera de 1 a 10000; registros anteriores tienen cantidad 1. Entradas por pieza: gramos de cada material, duración, postprocesado y precio manual. La revisión guarda totales de duración, gramos y acabados, cantidad y snapshot de entradas unitarias. Editar o duplicar recupera el snapshot para no multiplicar dos veces.

```text
q = cantidad
horasTotales = segundosPorPieza * q / 3600
material = SUM(gramosPorPieza_i * precioGramo_i) * q
energia = horasTotales * potenciaKW * tarifaEnergia
maquina = horasTotales * tarifaMaquina
contingencia = material * porcentajeContingencia / 100
postprocesado = SUM(importesPorPieza) * q
costoProduccion = material + energia + maquina + contingencia + postprocesado
```

Valores iniciales: potencia 0.15 kW; energía 1100 COP/kWh; máquina 2000 COP/h; contingencia 10% del material; multiplicadores 2, 2.5 y 3. Son editables y cada revisión conserva los utilizados.

**Redondeo implementado:** cada opción calcula el precio unitario con redondeo half-up a COP entero y luego multiplica por cantidad. El precio manual unitario se multiplica por cantidad y se redondea a COP entero. No calcular opciones desde subtotales ya cuantizados.

Aritmética decimal con precisión de 80 dígitos. Componentes se guardan con seis decimales; precio contractual y pagos en COP enteros. Gramos/precios por gramo admiten decimales, duración canónica en segundos. Una división sin base se muestra como no estimable.

Ejemplo sin postprocesado: 100 g a 80 COP/g, 1 h 30 min 30 s, cantidad 1: costo 12065.541666… COP; opciones 24131, 30164 y 36197 COP. Cantidad 2: material 16000, duración 10860 s; opciones 48262, 60328 y 72394 COP.

## Costo del pedido

```text
costoProducto = ajuste explícito del pedido, si existe;
               de lo contrario costo de la revisión aceptada
gananciaPedido = precioAcordado - costoProducto
```

Esta regla sustituye el diseño inicial que exigía registrar costos reales y confirmar completitud. Los registros `direct_cost` e intentos antiguos permanecen como historial; no se suman otra vez al costo vigente del producto. El costo cotizado por sí mismo no crea salida de caja.

Un ajuste comercial requiere administrador, motivo, versión y precio no inferior a pagos recibidos. Una revisión aceptada no se sobrescribe silenciosamente al crear pedidos nuevos.

## Pagos, saldo y cierre

```text
pagosRecibidos = SUM(pagos no anulados)
saldo = precioAcordado - pagosRecibidos
pagado = saldo igual a cero
```

Registrar pago positivo, fecha efectiva y medio desde selector. “Pagar saldo” registra el importe restante, no cambia solo una etiqueta. Se rechaza sobrepago bajo bloqueo de pedido. Cada pago válido genera una entrada de caja con su fecha.

Idempotencia protege el reintento de la misma operación. Otra compra, aunque use cotización y cliente anteriores, necesita una operación nueva y puede crear otro pedido.

Cerrar requiere entrega registrada, saldo cero y confirmación. Un pedido cerrado no admite pagos ni ajustes ordinarios. Correcciones administrativas excepcionales de datos requieren alcance autorizado, transacción y auditoría; no representan devoluciones.

## Períodos y métricas

| Indicador | Base implementada |
|---|---|
| Pedidos de Inicio | `order_date` dentro del período y estado actual; excluye archivados |
| Ventas | Precio de pedidos entregados en el período, por `delivered_at`; excluye archivados |
| Costo del producto | Costo cotizado/ajustado de esa cohorte entregada |
| Cobrado en la gráfica | Pagos válidos de esa cohorte hasta el cierre del período |
| Recaudo del período | Todos los pagos válidos por fecha efectiva en el período |
| Cartera global | Precio menos pagos al corte de pedidos confirmados no archivados |
| OPEX | Gastos clasificados operativos por fecha, separados en fijos/variables |
| Pérdidas independientes | Registros vigentes reconocidos en el período |
| Utilidad neta | Ventas - costo del producto - OPEX - pérdidas independientes |
| Flujo de caja | Entradas - salidas con fecha de movimiento en el período |
| Saldo de caja actual de Inicio | Todos los movimientos vigentes hasta hoy, aunque el filtro seleccionado sea otro |

Ventas no es dinero cobrado. Un pedido entregado e impago aporta venta y cartera; no aporta cobro hasta registrar el pago. La barra Cobrado no se suma a Ventas para calcular utilidad.

La cartera global puede incluir pedidos no entregados o entregados fuera del período. Por eso no siempre equivale a la diferencia entre las barras Ventas y Cobrado.

## Archivo y correcciones

Archivar un pedido lo excluye de pedidos, cartera, ventas y ranking activo. Sus pagos y movimientos de caja se conservan. El efectivo no desaparece por archivar el documento comercial; no se crea una devolución implícita.

Reportes usan registros válidos actuales al corte (`current_restated`): una corrección puede reexpresar períodos anteriores. No es un cierre contable inmutable ni contabilidad fiscal certificada.

Gasto de compra de materiales genera salida de caja y se excluye de OPEX. El consumo presupuestado afecta costo del producto y no crea otro desembolso. Una pérdida independiente no debe duplicar un costo registrado por otra vía.

## Punto de equilibrio

El código distribuye costo del producto variable según material, energía y postprocesado de la revisión; máquina y contingencia quedan en la parte no variable. Si existe override, la distribución se escala proporcionalmente a la revisión cuando hay base.

```text
contribucion = ventas - costoVariableProducto - OPEXvariable - perdidasIndependientes
tasa = contribucion / ventas
fijos = OPEXfijo + (costoProducto - costoVariableProducto)
ventasEquilibrio = fijos / tasa, si ventas > 0 y tasa > 0
```

Es una estimación operativa de la mezcla del período. Sin base o contribución positiva suficiente no se inventa una meta. No representa cobro garantizado ni depreciación certificada.

## Verificación pendiente

Probar en base aislada cantidades 1/2, edición sin doble multiplicación, redondeo unitario, compras repetidas, reintentos, pagos parciales, cierre impago, archivo y conciliación por fechas. La evidencia histórica está en [VALIDATION_REPORT](VALIDATION_REPORT.md); este documento no afirma una nueva ejecución.
