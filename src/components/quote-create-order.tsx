"use client";

import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {action} from "@/app/actions";
import {CustomerCombobox} from "@/components/customer-combobox";
import {Button} from "@/components/ui/button";
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription,DialogFooter} from "@/components/ui/dialog";
import {Field,FieldLabel} from "@/components/ui/field";
import {NativeSelect,NativeSelectOption} from "@/components/ui/native-select";
import {Alert,AlertTitle,AlertDescription} from "@/components/ui/alert";
import {Spinner} from "@/components/ui/spinner";

type Row=Record<string,unknown>;
export function QuoteCreateOrder({quoteId,revisionId,version,customerId,customers,intakes}:{quoteId:string;revisionId:string;version:unknown;customerId:string;customers:Row[];intakes:Row[]}){
 const router=useRouter(),key=useRef<string|null>(null);
 const [open,setOpen]=useState(false),[selected,setSelected]=useState(customerId),[intake,setIntake]=useState(""),[pending,setPending]=useState(false),[error,setError]=useState("");
 const matching=intakes.filter(order=>String(order.customerId)===selected);
 async function submit(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();if(pending)return;
  if(!selected){setError("Selecciona el cliente del pedido.");return;}
  setPending(true);setError("");
  try{
   key.current??=crypto.randomUUID();
   const result=await action("orders.convertQuote",{quoteId,acceptedRevisionId:revisionId,expectedVersion:version,customerId:selected,...(intake?{existingIntakeId:intake}:{}),idempotencyKey:key.current});
   if(!result.ok)setError(result.error.message);
   else{router.push("/pedidos/"+String((result.data as Row).id));router.refresh();}
  }catch{setError("No pudimos confirmar el pedido. Intenta de nuevo.");}
  finally{setPending(false);}
 }
 return <>
  <Button type="button" onClick={()=>{key.current=null;setSelected(customerId);setIntake("");setError("");setOpen(true);}}>Crear pedido</Button>
  <Dialog open={open} onOpenChange={next=>{if(!pending)setOpen(next);}}>
   <DialogContent className="sm:max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto" showCloseButton={!pending}>
    <DialogHeader><DialogTitle>Crear pedido</DialogTitle><DialogDescription>Selecciona el cliente. El pedido usará el precio y los materiales de la cotización aceptada.</DialogDescription></DialogHeader>
    <form onSubmit={submit} className="flex flex-col gap-4">
     <Field><FieldLabel htmlFor="quote-customer">Cliente *</FieldLabel><CustomerCombobox customers={customers} value={selected} onBlur={()=>{}} disabled={pending} onChange={id=>{setSelected(id);setIntake("");key.current=null;setError("");}}/></Field>
     {matching.length>0&&<details><summary className="cursor-pointer text-sm text-muted-foreground">Vincular a un pedido provisional</summary><p className="my-2 text-sm text-muted-foreground">Si ya registraste este trabajo, vincúlalo para evitar crear un pedido duplicado.</p><Field><FieldLabel htmlFor="existing-order">Pedido ya registrado</FieldLabel><NativeSelect id="existing-order" value={intake} disabled={pending} onChange={event=>{setIntake(event.target.value);key.current=null;}}><NativeSelectOption value="">Crear un pedido nuevo</NativeSelectOption>{matching.map(order=><NativeSelectOption key={String(order.id)} value={String(order.id)}>{String(order.code)} · {String(order.title)}</NativeSelectOption>)}</NativeSelect></Field></details>}
     {error&&<Alert variant="destructive" role="alert"><AlertTitle>No se pudo crear el pedido</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
     <DialogFooter className="mt-2"><Button type="button" variant="outline" disabled={pending} onClick={()=>setOpen(false)}>Cancelar</Button><Button type="submit" disabled={pending||!selected}>{pending&&<Spinner/>}{pending?"Creando…":intake?"Vincular pedido":"Confirmar y crear pedido"}</Button></DialogFooter>
    </form>
   </DialogContent>
  </Dialog>
 </>;
}
