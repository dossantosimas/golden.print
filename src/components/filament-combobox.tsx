"use client";

import {Combobox,ComboboxInput,ComboboxContent,ComboboxList,ComboboxItem,ComboboxEmpty} from "@/components/ui/combobox";
import {InputGroupAddon} from "@/components/ui/input-group";
import {FilamentColor} from "@/components/filament-color";
import {resolveFilamentColor} from "@/lib/filament-color";

export function FilamentCombobox({id,filaments,value,onChange,onBlur,disabled}:{id:string;filaments:Record<string,unknown>[];value:string;onChange:(id:string)=>void;onBlur:()=>void;disabled?:boolean}){
 const byId=new Map(filaments.map(filament=>[String(filament.id),filament]));
 const label=(id:string)=>{const filament=byId.get(id);return filament?[filament.brand,filament.model,filament.materialType,filament.color].filter(Boolean).join(" · "):"";};
 const selected=byId.get(value),color=resolveFilamentColor(selected?.color);
 return <Combobox items={[...byId.keys()]} value={value||null} onValueChange={id=>onChange(id??"")} itemToStringLabel={label} autoHighlight>
  <ComboboxInput id={id} placeholder="Buscar por marca, material o color…" disabled={disabled} onBlur={onBlur} showClear className="w-full">
   {selected&&<InputGroupAddon align="inline-start"><span aria-hidden="true" className={color?"color-swatch":"color-swatch color-swatch-unknown"} style={color?{backgroundColor:color}:undefined}/></InputGroupAddon>}
  </ComboboxInput>
  <ComboboxContent><ComboboxEmpty>No encontramos filamentos.</ComboboxEmpty><ComboboxList>{(id:string)=>{
   const filament=byId.get(id)!;
   return <ComboboxItem key={id} value={id} className="min-h-11 sm:min-h-9"><span className="flex min-w-0 flex-col"><span>{[filament.brand,filament.model,filament.materialType].filter(Boolean).join(" · ")}</span><FilamentColor value={filament.color}/></span></ComboboxItem>;
  }}</ComboboxList></ComboboxContent>
 </Combobox>;
}
