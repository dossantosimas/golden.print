# Reglas financieras y cotizador

> Regla vigente (2026-10-05, corrección del usuario): el costo del pedido se obtiene directamente del costo de producción de la revisión aceptada de la cotización, o de su ajuste explícito en el pedido. No se registra ni confirma otro costo real; la ganancia es precio acordado menos ese costo. Los registros anteriores de costos se conservan como historial y no se suman nuevamente. Los apartados históricos que exigen registro/completitud de costos quedan sustituidos por esta regla. El costo de producción no crea un movimiento de caja.

Estado: borrador de blueprint, no aprobado. Fuente: solicitud inicial y aclaraciones del propietario de 2026-10-02. Moneda única COP; zona America/Bogota; sin impuestos ni devoluciones.

## 1. Fórmula confirmada del cotizador

Los valores iniciales son editables, con unidades visibles. Cada cotización guarda una versión de los valores utilizados; cambiar ajustes no modifica una cotización enviada, aceptada ni un pedido anterior.

| Variable | Inicial | Unidad |
|---|---:|---|
| Potencia media | 0.15 | kW |
| Tarifa energía | 1100 | COP/kWh |
| Tarifa máquina | 2000 | COP/h |
| Contingencia | 10 | % del costo de material |
| Multiplicador mínimo | 2 | veces costo |
| Multiplicador medio | 2.5 | veces costo |
| Multiplicador alto | 3 | veces costo |

```text
horas = horasEntrada + minutos / 60 + segundos / 3600
material = SUM(gramos_i * precioGramo_i)
energia = horas * potenciaKW * tarifaEnergiaCOPKWh
maquina = horas * tarifaMaquinaCOPHora
contingencia = material * porcentajeContingencia / 100
costoBase = material + energia + maquina + contingencia
costoProduccion = costoBase + SUM(costosPostprocesado)

precioMinimo = costoProduccion * multiplicadorMinimo
precioMedio = costoProduccion * multiplicadorMedio
precioAlto = costoProduccion * multiplicadorAlto
```

Materiales múltiples: el costo por gramo de cada línea se obtiene del filamento seleccionado, permitiendo editarlo en la cotización sin modificar el catálogo. Precio por gramo del catálogo = valor de compra / peso en gramos; el peso debe ser mayor que cero.

**Postprocesado confirmado por el propietario:** sumar lijado, pintura, armado y demás líneas al costoBase antes de aplicar los multiplicadores. La contingencia sigue calculándose solamente sobre material. Los ejemplos siguientes usan postprocesado cero; con postprocesado 1000 COP, el costo aumenta 1000 y los precios sin redondear aumentan respectivamente 2000, 2500 y 3000 COP.

La aclaración sustituye las propuestas iniciales 20/50/100 y el cálculo de riesgo por reintentos esperados. No se aplica `1/(1-p)`. La contingencia confirmada es una reserva del 10% sobre material, no una probabilidad de fallo.

## 2. Multiplicadores, recargo y margen

Precio P, costo C: beneficio estimado = P-C; recargo sobre costo = (P-C)/C; margen sobre venta = (P-C)/P. No intercambiar bases.

| Oferta | Multiplicador | Recargo sobre costo | Margen sobre venta |
|---|---:|---:|---:|
| Mínimo | 2 | 100% | 50% |
| Medio | 2.5 | 150% | 60% |
| Alto | 3 | 200% | 66.6667% |

Mostrar costo, precio, diferencia y margen real sobre venta. Los multiplicadores son el control principal; si se permite editar un recargo porcentual equivalente, convertir mediante multiplicador = 1 + recargo/100. No permitir que dos controles definan simultáneamente valores incompatibles. Precio elegido manualmente sigue sujeto a valor no negativo y advertencia si es menor que costo estimado; no imponer rentabilidad ficticia.

## 3. Ejemplo de aceptación matemática

Tiempo 1h 30m 30s, 100g a 80 COP/g:

```text
t = 1.508333333... h
material = 8000
energia = 248.875
maquina = 3016.666666...
contingencia = 800
costoBase = 12065.541666...
precios antes de redondear = 24131.083333..., 30163.854166..., 36196.625
precios cobrables COP enteros = 24131, 30164, 36197
```

## 4. Precisión y validación propuestas

- Aritmética decimal en la fuente única de dominio; no usar flotantes binarios para persistir o acumular dinero.
- Precisión de cálculo decimal: 80 dígitos. Validar escalas y rangos de inputs antes de calcular; rechazar entradas o totales fuera de los rangos de PostgreSQL, sin truncar silenciosamente.
- Calcular precio cobrable desde inputs exactos del snapshot a precisión completa y redondear COP al final, antes de cuantizar subtotales informativos a numeric(18,6). Recalcular siempre desde inputs, nunca desde subtotales guardados redondeados.
- Gramos y precios unitarios conservan decimales; almacenamiento PostgreSQL numeric con escalas documentadas en DATABASE_DESIGN.md.
- Aplicar redondeo half-up a un peso únicamente al precio cobrable final. Mostrar costos estimados con hasta dos decimales; no alimentar cálculos con textos ya formateados.
- Pagos y gastos cobrados en COP enteros positivos; dinero real nunca negativo. Ajustes/correcciones son operaciones auditadas, no pagos negativos.
- Horas enteras no negativas, minutos/segundos enteros 0–59; usar duración en segundos como valor canónico.
- Potencia, tarifa, gramos y costos no negativos; porcentaje de contingencia entre 0 y 100; multiplicadores positivos y ordenados mínimo ≤ medio ≤ alto. Catálogo con peso positivo.
- Cociente con denominador cero: mostrar «Sin base de cálculo», devolver null en API; no Infinity, NaN ni 0% engañoso.
- Todos los precios, resúmenes, PDF y métricas consumen el mismo dominio financiero versionado. El servidor recalcula entradas; no confía en totales enviados por el navegador.

## 5. Estimado frente a real

El costo estimado de cotización no equivale a un gasto pagado ni a costo real. La contingencia no es una pérdida ni una salida de caja. Registrar cada intento de producción, resultado y sus costos reales de material, energía, máquina y acabado. Si se desconoce un costo, mantenerlo incompleto; no rellenarlo con cero silenciosamente.

Una impresión fallida conserva el intento anterior y sus costos; la reimpresión crea otro intento bajo el mismo pedido. «Dañado» describe el estado visible del trabajo; volver a «Imprimiendo» para reintentar no borra la pérdida del intento fallido.

Tarifa de máquina para cotizar es una tarifa comercial de costo estimado. El registro real debe indicar qué parte fue costo variable pagado y qué parte, si corresponde, asignación no monetaria de desgaste. La reserva y las asignaciones no generan caja automáticamente. No contabilizar la misma electricidad o mantenimiento como costo directo y OPEX.

Costo real del pedido = suma de todos los costos directos de sus intentos, exitosos y fallidos, incluidos acabados. Estado de completitud del costo visible; rentabilidad provisional si falta información. No declarar beneficio final completo mientras existan costos pendientes de registro.

## 6. Pagos y cartera

Pago = pedido, fecha efectiva, valor positivo, medio opcional, observaciones y usuario registrador. Medio de pago no es requisito confirmado; se propone opcional. Cada ingreso conserva auditoría.

```text
recaudoAcumuladoPedido = SUM(pagos válidos)
saldoPedido = precioCobrado - recaudoAcumuladoPedido
estadoPago = Pagado si saldoPedido = 0; Pendiente de pago si saldoPedido > 0
```

Impedir sobrepagos con transacción/bloqueo del pedido y validación de saldo. El estado de pago se deriva; «marcar pagado» propone registrar el saldo restante con fecha, sin crear un recaudo ficticio. Idempotencia de pago evita duplicación por doble clic/reintento.

No hay devoluciones en el MVP. No eliminar ni cancelar pedidos con pagos, ni bajar precio por debajo de lo recibido. Correcciones de errores de registro por administrador deben dejar reversión auditada, con motivo; una reversión técnica no devuelve dinero ni permite fingir pagos. Bloquear cancelación con pagos y explicar el motivo. Cambios financieros de pedidos entregados requieren corrección trazable y recálculo.

## 7. Bases temporales propuestas

Propuesta para aprobación del blueprint: distinguir compromiso comercial, resultado y caja.

- Valor comprometido: precio de pedidos confirmados, por confirmed_at. No es ingreso reconocido ni efectivo recibido.
- Ventas totales reconocidas: precio de pedidos entregados, por delivered_at. Dashboard y Finanzas utilizan esta misma regla y etiqueta «Ventas (entregadas)».
- Anticipos: ingreso de caja en payment.date; reducen saldo operativo. No generan ventas reconocidas hasta la entrega.
- Costos directos de ventas: costo real acumulado de los pedidos entregados del período, hasta la fecha de cierre consultada. Costos de pedidos aún en producción se muestran como trabajo en proceso, no se restan de ventas de otros pedidos.
- OPEX: gastos operativos por fecha efectiva, excluyendo compras de materiales y costos ya atribuidos a producción. MVP sin contabilidad fiscal, devengo de facturas ni depreciación certificada.
- Cartera: suma de saldos de pedidos confirmados activos, incluidos los pendientes de entrega. Mostrar cohorte o saldo global al cierre de forma explícita.
- Caja: ingresos y egresos por sus fechas de movimiento, independientemente de fecha de entrega.

Filtros: últimos 7 días, mes móvil, 3 meses móviles, año calendario actual, histórico completo y rango inclusivo de fechas. Convertir límites locales a [inicio, fin exclusivo) UTC; cierre de consulta nunca futuro. Al histórico sin límite se le aplica el momento actual como cierre.

Definición única de presets, con `hoy` como fecha local America/Bogota y extremos de fecha inclusivos:

| Preset | Inicio inclusivo | Fin inclusivo |
|---|---|---|
| Últimos 7 días | hoy menos 6 días | hoy |
| Último mes | hoy menos 1 mes calendario, ajustado al último día válido, más 1 día | hoy |
| Últimos 3 meses | hoy menos 3 meses calendario, ajustado al último día válido, más 1 día | hoy |
| Año actual | 1 de enero del año de hoy | hoy |
| Histórico | sin límite inferior | hoy |
| Personalizado | fecha inicial seleccionada | fecha final seleccionada, no posterior a hoy |

No sustituir meses móviles por 30/90 días. Ejemplo hoy 2026-10-02: semana 2026-09-26…10-02, mes 2026-09-03…10-02, 3 meses 2026-07-03…10-02. Si hoy=2026-03-31, mes inicia 2026-03-01 porque febrero termina el 28. Para instantes usar medianoche local al inicio y medianoche del día posterior al fin; si incluye hoy, limitar el corte al instante actual. Para campos date, comparar fechas efectivas inclusivas de registros válidos. Estas reglas están en el normalizador compartido del dominio.

Semántica histórica MVP: los reportes usan los registros válidos y corregidos actuales, filtrados por su fecha efectiva. Una corrección administrativa auditada puede reexpresar un período anterior; no se ofrece contabilidad cerrada ni reconstrucción de «lo conocido en esa fecha». El corte T limita fechas efectivas de operaciones, no fecha de creación de auditoría. Originales anulados permanecen para trazabilidad; reemplazos guardan fecha efectiva real, motivo y actor. Las cotizaciones publicadas siguen inmutables aunque los reportes administrativos se recalculen.

Los conteos de producción son operativos: pedidos cuya fecha comercial cae en el rango, agrupados por estado actual. Etiquetar esa base explícitamente; no presentarlos como estado histórico al corte.

Correcciones reales de costos/pérdidas son anulaciones y reemplazos auditados; las sumas usan solo filas válidas, por lo que corregir 100 a 120 no agrega 220. Si hay desembolsos asociados, corrección solo por administrador; impedir reducir el costo por debajo del efectivo válido registrado, exigir corregir antes cualquier egreso registrado erróneamente y conservar referencias/montos reales al reemplazo en la misma transacción. No hay devolución ni reintegro implícito.

## 8. Fuente única de métricas

Para cohorte D = pedidos entregados en período, corte T = fin consultado, V = ventas reconocidas de D, C = costo directo real de D acumulado hasta T, A = pagos de D acumulados hasta T, O = OPEX del período, L = pérdidas independientes reconocidas del período:

| Métrica | Fórmula / base |
|---|---|
| Ventas totales | V = suma precios de D |
| Costo de producción reconocido | C; costo completo o provisional claramente identificado |
| Margen bruto COP | V-C |
| Margen bruto % | (V-C)/V ×100 |
| Recaudo de ventas de la cohorte | A |
| Tasa de cobro | A/V ×100; pagos acumulados de la misma cohorte al corte |
| Saldo de cohorte | V-A |
| Porcentaje por cobrar | (V-A)/V ×100 |
| Recaudo real del período | suma pagos con fecha efectiva en período; no usarlo como numerador de tasa de cobro de otra cohorte |
| Cartera global | saldo al corte de todos los pedidos confirmados activos |
| OPEX | O; categorías operativas excluyendo material comprado/producción ya asignada |
| Pérdidas de reimpresión | subtotal costos de intentos fallidos, incluido en C cuando su pedido se entrega; indicador analítico, no nueva deducción |
| Pérdidas independientes | L; desperdicio no asignado y otros costos sin vínculo a un costo ya registrado |
| Utilidad operativa neta | V-C-O-L; mostrar «provisional» cuando C está incompleto |
| Entradas de caja | pagos registrados en período |
| Salidas de caja | egresos efectivamente pagados en período, cada evento una sola vez |
| Flujo neto | entradas-salidas |

No restar pérdidas de reimpresión dos veces. Material desperdiciado puede atribuirse a un intento O registrarse como pérdida independiente, nunca ambos. Trabajos no cobrados y castigos de cartera se conservan en NEXT: requieren evento de incobrabilidad distinto de falta de pago, con auditoría; un saldo pendiente no es automáticamente una pérdida.

Compras de filamento: movimiento de caja categoría «Compra de materiales», excluido de OPEX. Consumo real: costo directo de un intento, sin egreso nuevo si ya se compró el rollo. Costos directos pagados en el momento se vinculan al movimiento correspondiente; nunca sumar «costo» y «pago del mismo costo» como dos salidas. No implementar stock en gramos para conseguir esta separación.

## 9. Punto de equilibrio propuesto

El indicador estima el equilibrio operativo del período mediante contribución real, no recaudo. Separar costos directos variables CV y asignaciones no variables CFdir dentro de los costos reales. OPEX del período se clasifica fijo/variable; OV es OPEX variable y OF fijo. F = OF + CFdir. Contribución MC = V-CV-OV-L. Tasa r = MC/V.

```text
ventasEquilibrio = F/r, si V>0 y r>0 y costos completos
progreso = MC/F *100, si F>0
faltanteContribucion = max(F-MC, 0)
faltanteVentas = max(ventasEquilibrio-V, 0)
```

Mostrar progreso numérico puede superar 100%; barra visual se limita 0–100. F=0 con contribución no negativa: «Sin costos fijos que cubrir»; con pérdidas: «Contribución negativa». V=0, r≤0 o costos incompletos: «No estimable», con motivo, sin meta inventada. Si se permite pronóstico con tarifa estimada deberá aparecer como simulación, nunca como resultado real.

Es una estimación ponderada con la mezcla de pedidos y costos del período. El faltante de ventas supone que esa tasa de contribución se mantiene; cambia si cambian materiales, precios o mezcla. No se presenta como garantía de ventas futuras ni como certificación contable.

## 10. Pruebas críticas planificadas

Caso frontera obligatorio: 1 segundo, tarifa máquina editable 1799.999999 COP/h, multiplicador 3, demás componentes cero → precio ≈1.499999999167 → 1 COP. Cuantizar costo intermedio a 0.500000 y después multiplicar daría 2 COP y es incorrecto.

Tras aprobación: costo por gramo, materiales múltiples, h/m/s, energía y máquina, contingencia, multiplicadores/márgenes, cambio de ajustes con snapshot estable, redondeo, negativos y cero; pagos parciales/concurrentes/idempotentes; cohorte cobro contra caja; reimpresión sin doble pérdida; compra de rollo sin doble egreso; periodos Bogota; costo incompleto; punto equilibrio sin ventas/margen negativo/sin fijos. Este documento define resultados esperados; no afirma ejecución de tests ni implementación.
