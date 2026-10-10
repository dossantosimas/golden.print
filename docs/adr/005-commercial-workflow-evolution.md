# ADR 005 — Evolución de pedidos, costo y archivo

Fecha documental: 2026-10-09.
Estado: implementado en código; registro retrospectivo de requisitos explícitos del propietario.

## Contexto

El diseño inicial restringía una cotización a un pedido y exigía registro separado de costos reales. El propietario aclaró que la cotización se reutiliza para compras repetidas, que su costo es la base real del producto y que deben poder eliminarse pedidos equivocados.

## Decisión

1. Una cotización aceptada puede originar múltiples pedidos del mismo cliente o clientes diferentes. La idempotencia se aplica a la operación, no a la pareja cotización/cliente.
2. El costo vigente es revisión aceptada u override del pedido. Costos históricos se conservan sin sumarlos de nuevo.
3. Cantidad escala entradas por pieza; la revisión conserva cantidad, snapshot unitario y columnas totales.
4. Cerrar exige entrega y saldo cero. Pagado se deriva de pagos válidos.
5. Eliminar un pedido desde UI es archivo administrativo con motivo; conserva pagos, caja y auditoría, y se excluye del conjunto comercial activo.

## Consecuencias

La FK a revisión aceptada sigue preservando trazabilidad. Compras repetidas no redirigen silenciosamente al pedido anterior. La migración 0008 retira unicidad fuente/cliente y mantiene índice no único; 0007 agrega cantidad.

Archivo puede reducir ventas/cartera activa sin borrar efectivo real; reportes deben explicar esta diferencia. No se interpreta eliminación como devolución. Los contratos de cierre, cantidades, fechas y reporte necesitan regresiones en base aislada.

Fuentes: [reglas financieras](../FINANCIAL_RULES.md), [modelo](../DATABASE_DESIGN.md), [contratos](../API_DESIGN.md) y [cambios](../RELEASES.md). Sustituye las partes incompatibles de ADRs y blueprint anteriores, sin borrar su historia.
