import {describe,it,expect} from "vitest";
import {calculateQuote,defaultFormula,durationSeconds,type QuoteInput} from "../src/lib/finance";
import {periodRange,presetRange,todayBogota,validDate} from "../src/lib/dates";
const x:QuoteInput={projectName:"Ejemplo",businessDate:"2026-10-03",printSeconds:"5430",materials:[{filamentId:"11111111-1111-4111-8111-111111111111",grams:"100",pricePerGram:"80"}],postprocess:[],formula:defaultFormula};
describe("Fórmula comercial confirmada",()=>{
 it("multiplica tiempo, consumos, acabados y precios por la cantidad",()=>{
  const unit=calculateQuote({...x,postprocess:[{description:"Pintura",category:"paint",amount:"1000"}]});
  const two=calculateQuote({...x,quantity:2,postprocess:[{description:"Pintura",category:"paint",amount:"1000"}]});
  expect(Number(two.hours)).toBe(Number(unit.hours)*2);
  for(const key of Object.keys(unit.components) as (keyof typeof unit.components)[])expect(Number(two.components[key])).toBeCloseTo(Number(unit.components[key])*2,5);
  expect(two.priceOptions.map(p=>p.price)).toEqual(unit.priceOptions.map(p=>(BigInt(p.price)*2n).toString()));
  expect(calculateQuote({...x,quantity:2,manualPrice:"15000"}).selectedPrice).toBe("30000");
  for(const quantity of [0,-1,1.5,10001])expect(()=>calculateQuote({...x,quantity})).toThrow();
 });
 it("respeta el caso manual y precios finales",()=>{const r=calculateQuote(x);expect(r.components).toEqual({material:"8000.000000",energy:"248.875000",machine:"3016.666667",contingency:"800.000000",postprocess:"0.000000"});expect(r.priceOptions.map(p=>p.price)).toEqual(["24131","30164","36197"]);});
 it("incluye acabados antes de multiplicar y contingencia solo material",()=>{const r=calculateQuote({...x,postprocess:[{description:"Pintura",category:"paint",amount:"1000"}]});expect(r.components.contingency).toBe("800.000000");expect(r.priceOptions.map(p=>p.price)).toEqual(["26131","32664","39197"]);});
 it("redondea precio antes de cuantizar costos guardados",()=>{const r=calculateQuote({...x,printSeconds:"1",materials:[{...x.materials[0],grams:"1",pricePerGram:"0"}],formula:{powerKw:"0",energyRate:"0",machineRate:"1799.999999",contingencyRate:"0",multipliers:["2","2.5","3"]}});expect(r.priceOptions[2].price).toBe("1");});
 it("sin base devuelve null, y rechaza NaN/floats ilegales",()=>{const r=calculateQuote({...x,printSeconds:"0",materials:[{...x.materials[0],pricePerGram:"0"}]});expect(r.priceOptions[0].marginPercent).toBeNull();expect(()=>calculateQuote({...x,printSeconds:"NaN"})).toThrow();expect(()=>calculateQuote({...x,formula:{...defaultFormula,multipliers:["3","2","1"]}})).toThrow();});
 it("convierte h/m/s sin flotantes",()=>{expect(durationSeconds("1","30","30")).toBe("5430");expect(()=>durationSeconds("1","60","0")).toThrow();});
});
describe("Zona horaria y cortes",()=>{
 it("presets móviles de siete días, mes con clamp, trimestre y año",()=>{const now=new Date("2026-03-31T12:00:00Z");expect(presetRange("week",now)).toEqual({start:"2026-03-25",end:"2026-03-31"});expect(presetRange("month",now).start).toBe("2026-03-01");expect(presetRange("quarter",now).start).toBe("2026-01-01");expect(presetRange("year",now).start).toBe("2026-01-01");expect(presetRange("all",now).start).toBeNull();});
 it("Bogota conserva día anterior en UTC madrugada",()=>expect(todayBogota(new Date("2026-10-03T04:59:59Z"))).toBe("2026-10-02"));
 it("rango inclusivo convierte a fin exclusivo y limita ahora",()=>{const r=periodRange("2026-10-01","2026-10-02",new Date("2026-10-03T12:00:00Z"));expect(r.start?.toISOString()).toBe("2026-10-01T05:00:00.000Z");expect(r.end.toISOString()).toBe("2026-10-03T05:00:00.000Z");});
 it("rechaza fechas imposibles y cortes futuros",()=>{expect(()=>validDate("2026-02-30")).toThrow();expect(()=>periodRange(undefined,"2030-01-01",new Date("2026-10-03T12:00:00Z"))).toThrow();});
});
