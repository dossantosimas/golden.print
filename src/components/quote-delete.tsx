"use client";

import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {Trash2} from "lucide-react";
import {action} from "@/app/actions";
import {Button} from "@/components/ui/button";
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription,DialogFooter} from "@/components/ui/dialog";
import {Alert,AlertTitle,AlertDescription} from "@/components/ui/alert";
import {Spinner} from "@/components/ui/spinner";

export function QuoteDelete({quoteId,revisionId,version,code}:{quoteId:string;revisionId:string;version:unknown;code:string}){
 const router=useRouter(),key=useRef<string|null>(null);
 const [open,setOpen]=useState(false),[pending,setPending]=useState(false),[error,setError]=useState("");
 async function remove(){
  if(pending)return;
  setPending(true);setError("");
  try{
   key.current??=crypto.randomUUID();
   const result=await action("quotes.archive",{quoteId,revisionId,expectedVersion:version,idempotencyKey:key.current});
   if(!result.ok)setError(result.error.message);
   else{router.push("/cotizaciones");router.refresh();}
  }catch{setError("No pudimos eliminar la cotización. Intenta de nuevo.");}
  finally{setPending(false);}
 }
 return <>
  <Button type="button" variant="ghost" className="text-destructive" onClick={()=>{setError("");setOpen(true);}}><Trash2/>Eliminar cotización</Button>
  <Dialog open={open} onOpenChange={next=>{if(!pending)setOpen(next);}}>
   <DialogContent className="sm:max-w-md" showCloseButton={!pending}>
    <DialogHeader><DialogTitle>Eliminar {code}</DialogTitle><DialogDescription>Esta cotización dejará de aparecer en el listado. Se conservarán su historial y los pedidos vinculados.</DialogDescription></DialogHeader>
    {error&&<Alert variant="destructive" role="alert"><AlertTitle>No se pudo eliminar</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
    <DialogFooter><Button type="button" variant="outline" disabled={pending} onClick={()=>setOpen(false)}>Cancelar</Button><Button type="button" variant="destructive" disabled={pending} onClick={remove}>{pending?<Spinner/>:<Trash2/>}{pending?"Eliminando…":"Eliminar cotización"}</Button></DialogFooter>
   </DialogContent>
  </Dialog>
 </>;
}
