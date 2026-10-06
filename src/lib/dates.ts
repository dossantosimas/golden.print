export const timezone="America/Bogota";
export type PeriodPreset="day"|"week"|"month"|"quarter"|"year"|"all";
export function presetRange(preset:PeriodPreset,now=new Date()){
 const end=todayBogota(now),d=new Date(end+"T12:00:00Z");let start:string|null=end;
 if(preset==="all")start=null;
 else if(preset==="year")start=end.slice(0,4)+"-01-01";
 else if(preset==="week"){d.setUTCDate(d.getUTCDate()-6);start=d.toISOString().slice(0,10);}
 else if(preset==="month"||preset==="quarter"){const day=d.getUTCDate(),months=preset==="month"?1:3;d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()-months);const last=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();d.setUTCDate(Math.min(day,last)+1);start=d.toISOString().slice(0,10);}
 return {start,end};
}

export function todayBogota(now=new Date()){return new Intl.DateTimeFormat("en-CA",{timeZone:timezone,year:"numeric",month:"2-digit",day:"2-digit"}).format(now);}
export function validDate(v:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(v))throw new Error("Fecha inválida.");const d=new Date(v+"T00:00:00-05:00");if(!Number.isFinite(d.getTime())||todayBogota(d)!==v)throw new Error("Fecha inválida.");return v;}
export function periodRange(start?:string,end?:string,now=new Date()){const e=validDate(end??todayBogota(now));if(e>todayBogota(now))throw new Error("El corte no puede ser futuro.");const s=start?validDate(start):undefined;if(s&&s>e)throw new Error("Rango inválido.");const finish=new Date(e+"T00:00:00-05:00");finish.setUTCDate(finish.getUTCDate()+1);return {start:s?new Date(s+"T00:00:00-05:00"):undefined,end:new Date(Math.min(finish.getTime(),now.getTime())),startDate:s,endDate:e,temporalMode:"current_restated" as const};}
