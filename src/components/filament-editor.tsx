"use client";
import {useState} from "react";
import {Calculator} from "lucide-react";
import {CommandForm} from "@/components/command-form";
import {D} from "@/lib/finance";
import {unitMoney} from "@/components/display";

export function FilamentEditor({item}:{item:Record<string,unknown>}){
 const [price,setPrice]=useState(String(item.purchaseValue)),[weight,setWeight]=useState(String(item.rollWeightG));
 const valid=/^\d+(\.\d+)?$/.test(price)&&/^\d+(\.\d+)?$/.test(weight)&&new D(weight).gt(0);
 const rate=valid?new D(price).div(weight).toString():null;
 const payload={id:item.id,expectedVersion:item.version};
 return <div className="filament-editor-body" onChange={event=>{const input=event.target as HTMLInputElement;if(input.name==="purchaseValue")setPrice(input.value);if(input.name==="rollWeightG")setWeight(input.value);}}>
  <CommandForm command="filaments.update" payload={payload} label="Guardar cambios" fields={[
   {name:"brand",label:"Marca",required:true,value:String(item.brand)},
   {name:"model",label:"Modelo",required:true,value:String(item.model)},
   {name:"materialType",label:"Material",required:true,value:String(item.materialType)},
   {name:"color",label:"Color",required:true,value:String(item.color)},
   {name:"purchaseValue",label:"Precio del rollo (COP)",type:"number",min:"0",required:true,value:new D(String(item.purchaseValue)).toString()},
   {name:"rollWeightG",label:"Peso del rollo (g)",type:"number",min:"0.1",step:"0.1",required:true,value:String(item.rollWeightG)}
  ]}>
   <div className="filament-live-cost" aria-live="polite"><div><Calculator aria-hidden="true"/><span>Costo por gramo calculado</span></div><strong>{rate===null?"—":unitMoney(rate)}</strong><p>Precio del rollo ÷ peso registrado</p></div>
  </CommandForm>
  <details className="filament-archive"><summary>Archivar ficha de filamento</summary><p>Dejará de aparecer en el catálogo activo. Se conserva en las cotizaciones que ya la utilizan.</p><CommandForm command="filaments.archive" payload={payload} label="Archivar ficha" redirectTo="/filamentos"/></details>
 </div>;
}
