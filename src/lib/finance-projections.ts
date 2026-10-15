import {D,quantize} from "./finance";
import {validDate} from "./dates";
export type ProjectionMetrics=Record<string,unknown>;
const amount=(metrics:ProjectionMetrics,key:string)=>new D(String(metrics[key]??0));
export function monthOffset(month:string,offset:number){validDate(month+"-01");const date=new Date(month+"-01T12:00:00Z");date.setUTCMonth(date.getUTCMonth()+offset);return date.toISOString().slice(0,7);}
export function equilibrium(metrics:ProjectionMetrics){
 const sales=amount(metrics,"sales"),fixed=amount(metrics,"fixedCosts"),contribution=sales.minus(amount(metrics,"variableCosts"));
 const target=sales.gt(0)&&contribution.gt(0)?fixed.div(contribution.div(sales)):null;
 return {target:target===null?null:quantize(target),progress:target?.gt(0)?quantize(sales.div(target).times(100)):null,gap:target===null?null:quantize(D.max(0,target.minus(sales))),reached:target!==null&&sales.gte(target)};
}
export function averageMonths(months:ProjectionMetrics[]){
 if(months.length===0)throw new Error("Se requieren meses base.");
 return Object.fromEntries(["sales","fixedCosts","variableCosts","cashNet"].map(key=>[key,quantize(months.reduce((sum,month)=>sum.plus(amount(month,key)),new D(0)).div(months.length))]));
}
export function projectCurrentMonth(metrics:ProjectionMetrics,baseline:ProjectionMetrics,today:string){
 validDate(today);const year=Number(today.slice(0,4)),month=Number(today.slice(5,7)),elapsed=Number(today.slice(8)),days=new Date(Date.UTC(year,month,0)).getUTCDate(),factor=new D(days).div(elapsed);
 const sales=amount(metrics,"sales").times(factor),variableCosts=amount(metrics,"variableCosts").times(factor),fixedCosts=D.max(amount(metrics,"fixedCosts"),amount(baseline,"fixedCosts"));
 return {sales:quantize(sales),variableCosts:quantize(variableCosts),fixedCosts:quantize(fixedCosts),netProfit:quantize(sales.minus(variableCosts).minus(fixedCosts)),cashNet:quantize(amount(metrics,"cashNet").times(factor)),days,elapsed};
}
export function projectedProfit(metrics:ProjectionMetrics){return quantize(amount(metrics,"sales").minus(amount(metrics,"variableCosts")).minus(amount(metrics,"fixedCosts")));}
