"use client";
import {useRouter,useSearchParams} from "next/navigation";
import {List,LayoutGrid} from "lucide-react";
import {ToggleGroup,ToggleGroupItem} from "@/components/ui/toggle-group";
import {NativeSelect,NativeSelectOption} from "@/components/ui/native-select";

export function CustomerListControls(){
 const router=useRouter(),query=useSearchParams();
 const update=(key:string,value:string)=>{const params=new URLSearchParams(query);params.set(key,value);params.delete("page");router.push("?"+params.toString());};
 return <div className="customer-list-controls">
  <ToggleGroup aria-label="Vista de clientes" variant="outline" value={[query.get("view")??"table"]} onValueChange={value=>{if(value[0])update("view",String(value[0]));}}>
   <ToggleGroupItem value="table"><List/>Tabla</ToggleGroupItem><ToggleGroupItem value="cards"><LayoutGrid/>Tarjetas</ToggleGroupItem>
  </ToggleGroup>
  <NativeSelect aria-label="Orden de clientes" value={query.get("sort")??"date"} onChange={event=>update("sort",event.target.value)}>
   <NativeSelectOption value="date">Más recientes</NativeSelectOption><NativeSelectOption value="name">Nombre (A–Z)</NativeSelectOption><NativeSelectOption value="orders">Más pedidos</NativeSelectOption>
  </NativeSelect>
 </div>;
}
