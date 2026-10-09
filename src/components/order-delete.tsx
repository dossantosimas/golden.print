"use client";

import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {Trash2} from "lucide-react";
import {action} from "@/app/actions";
import {Button} from "@/components/ui/button";
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription,DialogFooter} from "@/components/ui/dialog";
import {Field,FieldLabel} from "@/components/ui/field";
import {Textarea} from "@/components/ui/textarea";
import {Alert,AlertTitle,AlertDescription} from "@/components/ui/alert";
import {Spinner} from "@/components/ui/spinner";

export function OrderDelete({orderId,version,code}:{orderId:string;version:unknown;code:string}){
 const router=useRouter(),key=useRef<string|null>(null);
 const [open,setOpen]=useState(false),[pending,setPending]=useState(false),[reason,setReason]=useState(""),[error,setError]=useState("");
 async function remove(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();if(pending||!reason.trim())return;
  setPending(true);setError("");
  try{
   key.current??=crypto.randomUUID();
   const result=await action("orders.archive",{orderId,expectedVersion:version,reason:reason.trim(),idempotencyKey:key.current});
   if(!result.ok)setError(result.error.message);
   else{router.push("/pedidos");router.refresh();}
  }catch{setError("No pudimos confirmar la eliminación. Reintenta la misma operación.");}
  finally{setPending(false);}
 }
 return <>
  <Button type="button" variant="outline" className="text-destructive" onClick={()=>{setError("");setOpen(true);}}><Trash2/>Eliminar pedido</Button>
  <Dialog open={open} onOpenChange={next=>{if(!pending)setOpen(next);}}>
   <DialogContent className="sm:max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto" showCloseButton={!pending}>
    <DialogHeader><DialogTitle>Eliminar {code}</DialogTitle><DialogDescription>Este pedido dejará de aparecer en los listados y no contará en ventas ni en saldos por cobrar. Se conservarán su historial y la cotización original.</DialogDescription></DialogHeader>
    <p className="text-sm text-muted-foreground">Los pagos y movimientos de caja registrados se conservan. Eliminar el pedido no representa una devolución de dinero.</p>
    <form onSubmit={remove} className="flex flex-col gap-4">
     <Field><FieldLabel htmlFor="order-delete-reason">Motivo de eliminación *</FieldLabel><Textarea id="order-delete-reason" value={reason} maxLength={5000} required disabled={pending} onChange={event=>{setReason(event.target.value);key.current=null;}} placeholder="Por ejemplo: pedido duplicado o creado por error"/></Field>
     {error&&<Alert variant="destructive" role="alert"><AlertTitle>No se pudo eliminar</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
     <DialogFooter><Button type="button" variant="outline" disabled={pending} onClick={()=>setOpen(false)}>Cancelar</Button><Button type="submit" variant="destructive" disabled={pending||!reason.trim()}>{pending?<Spinner/>:<Trash2/>}{pending?"Eliminando…":"Eliminar pedido"}</Button></DialogFooter>
    </form>
   </DialogContent>
  </Dialog>
 </>;
}
