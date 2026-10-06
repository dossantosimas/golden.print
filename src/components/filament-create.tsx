"use client";
import {useState} from "react";
import {Calculator} from "lucide-react";
import {CommandForm} from "@/components/command-form";
import {D} from "@/lib/finance";
import {unitMoney} from "@/components/display";

export function FilamentCreate(){
 const [price,setPrice]=useState(""),[weight,setWeight]=useState("1000");
 const valid=/^\d+(\.\d+)?$/.test(price)&&/^\d+(\.\d+)?$/.test(weight)&&new D(weight).gt(0);
 const rate=valid?new D(price).div(weight).toString():null;
 return <div onChange={event=>{const input=event.target as HTMLInputElement;if(input.name==="purchaseValue")setPrice(input.value);if(input.name==="rollWeightG")setWeight(input.value);}}>
  <CommandForm command="filaments.create" label="Guardar filamento" fields={[{name:"brand",label:"Marca",required:true},{name:"model",label:"Modelo",required:true},{name:"materialType",label:"Material",value:"PLA",required:true},{name:"color",label:"Color",required:true},{name:"purchaseValue",label:"Precio del rollo (COP)",type:"number",min:"0",required:true},{name:"rollWeightG",label:"Peso del rollo (g)",type:"number",min:"0.1",step:"0.1",value:"1000",required:true}]}>
   <div className="filament-live-cost" aria-live="polite"><div><Calculator aria-hidden="true"/><span>Costo por gramo</span></div><strong>{rate===null?"—":unitMoney(rate)}</strong><p>Precio del rollo ÷ peso registrado</p></div>
  </CommandForm>
 </div>;
}
