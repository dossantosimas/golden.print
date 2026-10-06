"use client";
import {useRouter,useSearchParams} from "next/navigation";
import {ToggleGroup,ToggleGroupItem} from "@/components/ui/toggle-group";
import {presetRange,type PeriodPreset} from "@/lib/dates";
const presets:Record<PeriodPreset,string>={day:"Hoy",week:"7 días",month:"1 mes",quarter:"3 meses",year:"Este año",all:"Todo"};
export function PeriodPresets(){const router=useRouter();const search=useSearchParams();const start=search.get("start")??"",end=search.get("end")??"";const selected=Object.keys(presets).find(value=>{const range=presetRange(value as PeriodPreset);return (range.start??"")===start&&range.end===end;})??(!start&&!end?"all":undefined);return <ToggleGroup className="flex-wrap" aria-label="Período rápido" variant="outline" value={selected?[selected]:[]} onValueChange={v=>{if(v[0]){const range=presetRange(String(v[0]) as PeriodPreset);router.push("?"+new URLSearchParams({start:range.start??"",end:range.end}).toString());}}}>{Object.entries(presets).map(([value,label])=><ToggleGroupItem key={value} value={value}>{label}</ToggleGroupItem>)}</ToggleGroup>;}
