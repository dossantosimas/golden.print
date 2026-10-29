import Decimal from "decimal.js";
const higherIsBetter=new Set(["sales","receipts","netProfit","cashIn","cashNet"]);
const lowerIsBetter=new Set(["directCosts","opex","independentLosses","cashOut","receivables"]);
export function comparisonSignal(metric:string,difference:unknown):{tone:"positive"|"negative"|"neutral";label:string}{
 let value:Decimal;try{value=new Decimal(String(difference));}catch{return {tone:"neutral",label:"Sin base"};}
 if(!value.isFinite())return {tone:"neutral",label:"Sin base"};
 if(value.isZero())return {tone:"neutral",label:"Sin cambio"};
 if(!higherIsBetter.has(metric)&&!lowerIsBetter.has(metric))return {tone:"neutral",label:"Sin clasificación"};
 const good=higherIsBetter.has(metric)?value.gt(0):value.lt(0);
 return good?{tone:"positive",label:"Mejora"}:{tone:"negative",label:"Desfavorable"};
}
