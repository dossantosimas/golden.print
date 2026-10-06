"use client";
import {useState} from "react";
import {Wallet} from "lucide-react";
import {CommandForm} from "@/components/command-form";
import {money} from "@/components/display";

export function ExpenseEditor({item,responsibles}:{item:Record<string,unknown>;responsibles:{value:string;label:string}[]}){
 const [classification,setClassification]=useState(String(item.classification)),[amount,setAmount]=useState(String(item.amount));
 const options=responsibles.some(r=>r.value===String(item.responsibleUserId))?responsibles:[{value:String(item.responsibleUserId),label:String(item.responsibleName)},...responsibles];
 const payload={expenseId:item.id,expectedVersion:item.version};
 return <div className="expense-editor-body" onChange={event=>{const input=event.target as HTMLInputElement;if(input.name==="classification")setClassification(input.value);if(input.name==="amount")setAmount(input.value);}}>
  <CommandForm command="expenses.update" payload={payload} label="Guardar corrección" redirectTo="/gastos/:id" fields={[
   {name:"reason",label:"Motivo de la corrección",required:true,help:"Explica qué dato necesitas corregir."},
   {name:"expenseDate",label:"Fecha",type:"date",value:String(item.expenseDate),required:true},
   {name:"amount",label:"Valor (COP)",type:"number",min:"1",step:"1",value:String(item.amount),required:true},
   {name:"description",label:"Descripción",value:String(item.description),required:true},
   {name:"classification",label:"Clasificación",value:String(item.classification),required:true,options:[{value:"opex",label:"Gasto operativo"},{value:"material_purchase",label:"Compra de material"}]},
   ...(classification==="opex"?[{name:"costBehavior",label:"Comportamiento",value:String(item.costBehavior??"fixed"),required:true,options:[{value:"fixed",label:"Fijo"},{value:"variable",label:"Variable"}]}]:[]),
   {name:"category",label:"Categoría",value:String(item.category),required:true},
   {name:"responsibleUserId",label:"Responsable",value:String(item.responsibleUserId),options,required:true},
   {name:"notes",label:"Notas internas",type:"textarea",value:String(item.notes??"")}
  ]}>
   <div className="expense-save-summary" aria-live="polite"><span><Wallet aria-hidden="true"/>Valor corregido</span><strong>{/^\d+$/.test(amount)?money(amount):"—"}</strong><small>{classification==="opex"?"Se refleja en gastos operativos y caja.":"Se refleja en caja; no se duplica como gasto operativo."}</small></div>
  </CommandForm>
  <details className="expense-detail-void"><summary>Anular registro erróneo</summary><p>El registro dejará de afectar los resultados y la caja. Se conserva su historial y el motivo de anulación.</p><CommandForm command="expenses.void" payload={payload} fields={[{name:"reason",label:"Motivo de anulación",required:true}]} label="Anular registro"/></details>
 </div>;
}
