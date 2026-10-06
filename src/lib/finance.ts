import Decimal from "decimal.js";
import { z } from "zod";
export const D = Decimal.clone({ precision: 80, rounding: Decimal.ROUND_HALF_UP });
const dec = z.string().regex(/^(0|[1-9]\d{0,11})(\.\d{1,6})?$/, "Usa un decimal positivo con hasta seis decimales.");
const factor = dec.refine(v=>new D(v).lte("999999"),"Factor fuera de rango.");
export const defaultFormula = {powerKw:"0.15",energyRate:"1100",machineRate:"2000",contingencyRate:"0.10",multipliers:["2","2.5","3"]};
export const formulaSchema=z.object({powerKw:factor,energyRate:dec,machineRate:dec,contingencyRate:factor.refine(v=>new D(v).lte(1)),multipliers:z.array(factor.refine(v=>new D(v).gt(0))).length(3)}).strict().refine(v=>new D(v.multipliers[0]).lte(v.multipliers[1])&&new D(v.multipliers[1]).lte(v.multipliers[2]),"Multiplicadores deben estar ordenados.");
export const quoteInputSchema = z.object({
 projectName:z.string().trim().min(1).max(200), customerId:z.string().uuid().optional(),description:z.string().max(5000).default(""),
 printSeconds:z.string().regex(/^(0|[1-9]\d{0,11})$/),
 materials:z.array(z.object({filamentId:z.string().uuid(),grams:dec.refine(v=>new D(v).gt(0)),pricePerGram:dec}).strict()).min(1).max(100),
 postprocess:z.array(z.object({description:z.string().trim().min(1).max(200),category:z.string().max(100),amount:dec}).strict()).max(100).default([]),
 formula:formulaSchema, selectedLevel:z.enum(["minimum","medium","high"]).default("medium"),
 manualPrice:z.string().regex(/^(0|[1-9]\d{0,17})$/).optional(),
 businessDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),validUntil:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
 customerNotes:z.string().max(5000).optional(),internalNotes:z.string().max(5000).optional(),
}).strict();
export type QuoteInput=z.input<typeof quoteInputSchema>;
export function quantize(v:Decimal.Value){const n=new D(v);if(!n.isFinite()||n.abs().gte("1000000000000"))throw new Error("Importe fuera del límite admitido.");return n.toFixed(6);}
export function wholeCop(v:Decimal.Value){const n=new D(v).toDecimalPlaces(0);if(n.abs().gte("1000000000000000000"))throw new Error("Precio fuera del límite admitido.");return n.toFixed(0);}
export function calculateQuote(input:QuoteInput){
 const x=quoteInputSchema.parse(input), h=new D(x.printSeconds).div(3600);
 const material=x.materials.reduce((n,m)=>n.plus(new D(m.grams).times(m.pricePerGram)),new D(0));
 const energy=h.times(x.formula.powerKw).times(x.formula.energyRate),machine=h.times(x.formula.machineRate),contingency=material.times(x.formula.contingencyRate);
 const postprocess=x.postprocess.reduce((n,p)=>n.plus(p.amount),new D(0)),cost=material.plus(energy).plus(machine).plus(contingency).plus(postprocess);
 const levels=["minimum","medium","high"] as const;
 const priceOptions=x.formula.multipliers.map((multiplier,i)=>{const p=new D(wholeCop(cost.times(multiplier))), profit=p.minus(cost);return {level:levels[i],multiplier,price:p.toFixed(0),profit:quantize(profit),marginPercent:p.isZero()?null:quantize(profit.div(p).times(100)),markupPercent:cost.isZero()?null:quantize(profit.div(cost).times(100))};});
 return {hours:h.toString(),components:{material:quantize(material),energy:quantize(energy),machine:quantize(machine),contingency:quantize(contingency),postprocess:quantize(postprocess)},costProduction:quantize(cost),priceOptions,selectedPrice:x.manualPrice??priceOptions[levels.indexOf(x.selectedLevel)].price};
}
export function cop(value:string|number|null|undefined){return value==null?"Sin base":new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(Number(value));}
export function durationSeconds(hours:string,minutes:string,seconds:string){if(!/^\d+$/.test(hours)||!/^\d+$/.test(minutes)||!/^\d+$/.test(seconds)||BigInt(minutes)>59n||BigInt(seconds)>59n)throw new Error("Tiempo inválido.");return (BigInt(hours)*3600n+BigInt(minutes)*60n+BigInt(seconds)).toString();}

