import Decimal from "decimal.js";

export type MetricSignal = {tone: "positive" | "negative" | "warning" | "info" | "neutral"; label: string};
export function metricSignal(metric: string, value: unknown): MetricSignal {
  if(value === null || value === undefined) return {tone:"neutral", label:"Sin base"};
  let amount: Decimal;
  try { amount = new Decimal(String(value)); } catch { return {tone:"neutral",label:"Sin base"}; }
  if(!amount.isFinite()) return {tone:"neutral",label:"Sin base"};
  const positive = amount.gt(0);
  if(metric === "receivables") return positive ? {tone:"warning",label:"Por cobrar"} : {tone:"positive",label:"Sin saldo pendiente"};
  if(["damaged","failedCosts","independentLosses"].includes(metric)) return positive ? {tone:"negative",label:metric === "damaged" ? "Requiere atención" : "Pérdidas registradas"} : {tone:"positive",label:metric === "damaged" ? "Sin fallos" : "Sin pérdidas"};
  if(metric === "not_started") return positive ? {tone:"warning",label:"Pendientes"} : {tone:"neutral",label:"Sin pendientes"};
  if(metric === "printing") return positive ? {tone:"info",label:"En producción"} : {tone:"neutral",label:"Sin impresiones activas"};
  if(metric === "closed") return positive ? {tone:"positive",label:"Cerrados"} : {tone:"neutral",label:"Sin cierres"};
  if(metric === "finished" || metric === "delivered") return positive ? {tone:"positive",label:metric === "finished" ? "Listos para entregar" : "Entregados"} : {tone:"neutral",label:metric === "finished" ? "Sin pedidos terminados" : "Sin entregas"};
  if(["netProfit","grossProfit","grossMargin","cashNet"].includes(metric)) return amount.lt(0) ? {tone:"negative",label:metric === "cashNet" ? "Más salidas que entradas" : "Pérdida"} : positive ? {tone:"positive",label:metric === "cashNet" ? "Caja positiva" : "Utilidad positiva"} : {tone:"neutral",label:metric === "cashNet" ? "Caja equilibrada" : "Sin utilidad"};
  if(metric === "collectionRate" || metric === "breakEvenProgress") return amount.gte(100) ? {tone:"positive",label:metric === "collectionRate" ? "Cobro completo" : "Equilibrio alcanzado"} : {tone:"warning",label:metric === "collectionRate" ? "Cobro pendiente" : "Equilibrio pendiente"};
  if(["sales","receipts","cohortReceipts","cashIn"].includes(metric)) return positive ? {tone:"positive",label:metric === "sales" ? "Ventas registradas" : "Ingresos registrados"} : {tone:"neutral",label:"Sin movimientos"};
  return {tone:"neutral",label:metric === "totalOrders" ? "En el período" : "Registrado"};
}
