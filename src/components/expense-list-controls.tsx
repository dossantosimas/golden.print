"use client";
import {useRouter,useSearchParams} from "next/navigation";
import {List,LayoutGrid} from "lucide-react";
import {ToggleGroup,ToggleGroupItem} from "@/components/ui/toggle-group";
import {NativeSelect,NativeSelectOption} from "@/components/ui/native-select";
export function ExpenseListControls({categories,start,end}:{categories:string[];start:string;end:string}){
 const router=useRouter(),query=useSearchParams();
 const update=(key:string,value:string)=>{const p=new URLSearchParams(query);p.set("start",start);p.set("end",end);if(value)p.set(key,value);else p.delete(key);p.delete("page");router.push("?"+p.toString());};
 return <div className="expense-list-controls"><NativeSelect aria-label="Filtrar por categoría" value={query.get("filter")??""} onChange={e=>update("filter",e.target.value)}><NativeSelectOption value="">Todas las categorías</NativeSelectOption>{categories.map(c=><NativeSelectOption key={c} value={c}>{c}</NativeSelectOption>)}</NativeSelect><NativeSelect aria-label="Orden de gastos" value={query.get("sort")??"date"} onChange={e=>update("sort",e.target.value)}><NativeSelectOption value="date">Más recientes</NativeSelectOption><NativeSelectOption value="amount">Mayor monto</NativeSelectOption><NativeSelectOption value="amount_asc">Menor monto</NativeSelectOption></NativeSelect><ToggleGroup aria-label="Vista de gastos" variant="outline" value={[query.get("view")??"table"]} onValueChange={v=>{if(v[0])update("view",String(v[0]));}}><ToggleGroupItem value="table"><List/>Tabla</ToggleGroupItem><ToggleGroupItem value="cards"><LayoutGrid/>Tarjetas</ToggleGroupItem></ToggleGroup></div>;
}
