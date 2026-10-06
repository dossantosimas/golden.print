"use client";
import {useState} from "react";
import {Wallet} from "lucide-react";
import {CommandForm} from "@/components/command-form";
import {money} from "@/components/display";

export function ExpenseCreate({today,userId,responsibles}:{today:string;userId:string;responsibles:{value:string;label:string}[]}){
 const [classification,setClassification]=useState("opex"),[amount,setAmount]=useState("");
 return <div onChange={event=>{const input=event.target as HTMLInputElement;if(input.name==="classification")setClassification(input.value);if(input.name==="amount")setAmount(input.value);}}>
 <CommandForm onCreated={()=>{setClassification("opex");setAmount("");}} command="expenses.create" label="Guardar gasto" fields={[{name:"expenseDate",label:"Fecha",type:"date",value:today,required:true},{name:"description",label:"Descripción",required:true},{name:"classification",label:"Clasificación",value:"opex",required:true,options:[{value:"opex",label:"Gasto operativo"},{value:"material_purchase",label:"Compra de material"}]},...(classification==="opex"?[{name:"costBehavior",label:"Comportamiento",value:"fixed",required:true,options:[{value:"fixed",label:"Fijo"},{value:"variable",label:"Variable"}]}]:[]),{name:"category",label:"Categoría",required:true},{name:"amount",label:"Valor (COP)",type:"number",min:"1",step:"1",required:true},{name:"responsibleUserId",label:"Responsable",value:userId,required:true,options:responsibles},{name:"notes",label:"Notas internas",type:"textarea"}]}>
 <div className="expense-save-summary" aria-live="polite"><span><Wallet aria-hidden="true"/>Egreso a registrar</span><strong>{/^\d+$/.test(amount)?money(amount):"—"}</strong><small>{classification==="opex"?"Se refleja en gastos operativos y caja.":"Se refleja en caja; no se duplica como gasto operativo."}</small></div>
 </CommandForm></div>;
}
