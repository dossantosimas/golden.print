"use client";
import {useRouter,useSearchParams} from "next/navigation";
import {LayoutGrid,List} from "lucide-react";
import {ToggleGroup,ToggleGroupItem} from "@/components/ui/toggle-group";
import {NativeSelect,NativeSelectOption} from "@/components/ui/native-select";
export function FilamentListControls({materials}:{materials:string[]}){
 const router=useRouter(),query=useSearchParams();
 const update=(key:string,value:string)=>{const params=new URLSearchParams(query);if(value)params.set(key,value);else params.delete(key);params.delete("page");router.push("?"+params.toString());};
 return <div className="filament-controls"><ToggleGroup aria-label="Vista de filamentos" variant="outline" value={[query.get("view")??"cards"]} onValueChange={v=>{if(v[0])update("view",String(v[0]));}}><ToggleGroupItem value="cards"><LayoutGrid/>Tarjetas</ToggleGroupItem><ToggleGroupItem value="table"><List/>Tabla</ToggleGroupItem></ToggleGroup>
 <NativeSelect aria-label="Filtrar por material" value={query.get("filter")??""} onChange={e=>update("filter",e.target.value)}><NativeSelectOption value="">Todos los materiales</NativeSelectOption>{materials.map(m=><NativeSelectOption key={m} value={m}>{m}</NativeSelectOption>)}</NativeSelect>
 <NativeSelect aria-label="Orden de filamentos" value={query.get("sort")??"date"} onChange={e=>update("sort",e.target.value)}><NativeSelectOption value="date">Más recientes</NativeSelectOption><NativeSelectOption value="unit_asc">Costo: menor a mayor</NativeSelectOption><NativeSelectOption value="unit_desc">Costo: mayor a menor</NativeSelectOption><NativeSelectOption value="weight_desc">Mayor peso del rollo</NativeSelectOption></NativeSelect></div>;
}
