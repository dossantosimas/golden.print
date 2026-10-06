"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {action} from "@/app/actions";
import {Button} from "@/components/ui/button";
import {NativeSelect,NativeSelectOption} from "@/components/ui/native-select";
import {Field,FieldLabel} from "@/components/ui/field";
import {money,display} from "@/components/display";

export function OrderQuotePicker({orderId,customerId,quotes}:{orderId:string;customerId:string;quotes:Record<string,unknown>[]}) {
 const router=useRouter();const [selected,setSelected]=useState("");const [pending,setPending]=useState(false);const [error,setError]=useState("");
 const quote=quotes.find(q=>q.id===selected);
 async function link(){if(!quote||pending)return;setPending(true);setError("");try{const result=await action("orders.convertQuote",{quoteId:quote.id,acceptedRevisionId:quote.revisionId,expectedVersion:quote.version,customerId,existingIntakeId:orderId,idempotencyKey:crypto.randomUUID()});if(!result.ok)setError(result.error.message);else router.refresh();}catch{setError("No pudimos vincular la cotización. Intenta de nuevo.");}finally{setPending(false);}}
 return <div className="flex flex-col gap-3"><Field><FieldLabel htmlFor="order-quote">Cotización del cliente</FieldLabel><NativeSelect id="order-quote" value={selected} disabled={pending} onChange={e=>{setSelected(e.target.value);setError("");}}><NativeSelectOption value="">Seleccionar cotización</NativeSelectOption>{quotes.map(q=><NativeSelectOption key={String(q.id)} value={String(q.id)}>{String(q.code)} · {String(q.projectName)} · {display(q.status)}</NativeSelectOption>)}</NativeSelect></Field>
 {quote&&<><dl className="data-summary"><div><dt>Costo estimado del producto</dt><dd>{money(quote.estimatedCost)}</dd></div><div><dt>Precio cotizado al cliente</dt><dd>{money(quote.quotedPrice)}</dd></div></dl><div className="flex flex-wrap items-center gap-3"><Link className="inline-link" href={"/cotizaciones/"+quote.id+(quote.status==="draft"?"/editar":"")}>{quote.status==="draft"?"Modificar cotización":"Ver cotización"}</Link><Button disabled={pending||quote.status!=="accepted"} onClick={link}>{pending?"Vinculando…":"Vincular a este pedido"}</Button></div>{quote.status!=="accepted"&&<p className="text-xs text-muted-foreground">Envía y acepta la cotización para confirmar el precio y habilitar producción y abonos.</p>}</>}
 {!quotes.length&&<p className="text-sm text-muted-foreground">No hay cotizaciones disponibles para este cliente.</p>}
 <Link className="inline-link" href="/cotizaciones/nueva">Crear cotización</Link>{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
 </div>;
}
