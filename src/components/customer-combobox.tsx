"use client";

import {Combobox,ComboboxInput,ComboboxContent,ComboboxList,ComboboxItem,ComboboxEmpty} from "@/components/ui/combobox";

export function CustomerCombobox({customers,value,onChange,onBlur,disabled}:{customers:Record<string,unknown>[];value:string;onChange:(id:string)=>void;onBlur:()=>void;disabled?:boolean}){
 const labels=new Map(customers.map(customer=>[String(customer.id),String(customer.name)]));
 const items=["",...labels.keys()];
 return <Combobox items={items} value={value||null} onValueChange={id=>onChange(id??"")} itemToStringLabel={id=>labels.get(id)??"Sin cliente"} autoHighlight>
  <ComboboxInput id="quote-customer" placeholder="Buscar cliente…" showClear disabled={disabled} onBlur={onBlur} className="w-full"/>
  <ComboboxContent><ComboboxEmpty>No encontramos clientes.</ComboboxEmpty><ComboboxList>{(id:string)=>{
   const customer=customers.find(customer=>String(customer.id)===id);
   return <ComboboxItem key={id||"none"} value={id}><span className="flex min-w-0 flex-col"><span>{labels.get(id)??"Sin cliente"}</span>{customer&&Boolean(customer.contactPhone||customer.email)&&<small className="text-muted-foreground">{String(customer.contactPhone||customer.email)}</small>}</span></ComboboxItem>;
  }}</ComboboxList></ComboboxContent>
 </Combobox>;
}
