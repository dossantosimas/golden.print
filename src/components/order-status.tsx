import {CalendarDays, Check, LockKeyhole, PackageCheck} from "lucide-react";
import {CommandForm} from "@/components/command-form";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {display,money} from "@/components/display";
import {D} from "@/lib/finance";

type Row=Record<string,unknown>;
const stages=["not_started","printing","finished","delivered","closed"];
function stamp(value:unknown){return value?new Intl.DateTimeFormat("es-CO",{timeZone:"America/Bogota",dateStyle:"medium",timeStyle:"short"}).format(new Date(String(value))):null;}
export function OrderStatus({item,attempts,seconds,deliveryDate,today}:{item:Row;attempts:Row[];seconds:bigint;deliveryDate:string;today:string}){
 const id=String(item.id),status=String(item.status),closed=Boolean(item.closedAt),current=status==="damaged"?1:stages.indexOf(status);
 const paid=item.balance!=null&&new D(String(item.balance)).isZero();
 const attempt=attempts.find(a=>a.status==="printing"),success=attempts.find(a=>a.status==="success");
 const times=[stamp(item.confirmedAt),stamp(attempt?.startedAt??success?.startedAt),stamp(success?.completedAt),item.deliveredAt?deliveryDate:null,stamp(item.closedAt)];
 const captions=["Cotización aceptada",status==="damaged"?"Impresión fallida":"Impresión del producto","Impresión finalizada","Entrega al cliente","Cierre definitivo"];
 return <section className="order-status-panel" aria-label="Estado del pedido">
  <header className="order-status-heading"><div className="order-status-title"><span className="order-status-icon"><PackageCheck/></span><h2>Estado del pedido</h2><small>Hito {current+1} de 5</small></div><Badge variant="secondary" data-status={status}>{closed?"Cerrado":status==="delivered"?"Entregado con éxito":display(status)}</Badge></header>
  <ol className="order-status-timeline" aria-label="Avance del pedido">{stages.map((state,index)=>{const done=current>index||status==="closed",active=current===index;return <li key={state} data-complete={done} aria-current={active?"step":undefined}><div><span className="order-stage-number">{done?<Check aria-hidden="true"/>:index+1}</span><strong>{index+1}. {display(state)}</strong></div><span className="order-stage-bar"/><small>{index<=current?captions[index]:"Pendiente"}</small>{index<=current&&times[index]&&<time>{times[index]}</time>}</li>;})}</ol>
  <div className="order-status-body">
   {["not_started","damaged"].includes(status)&&<div className="order-status-start"><p>{status==="damaged"?"La impresión falló. Inicia un nuevo intento.":"Pedido listo para iniciar impresión."}</p><CommandForm command={status==="damaged"?"production.reprint":"production.startAttempt"} payload={{orderId:id,expectedVersion:item.version}} label={status==="damaged"?"Volver a imprimir":"Iniciar impresión"}/></div>}
   {status==="printing"&&attempt&&<div className="order-status-start"><div><p>Impresión en curso</p><small>Tiempo estimado: {String(seconds/3600n)} h {String(seconds%3600n/60n)} min</small><CommandForm command="production.completeAttempt" payload={{attemptId:attempt.id,orderVersion:item.version}} label="Finalizar impresión"/></div><details className="order-inline-editor"><summary>Registrar fallo</summary><CommandForm command="production.failAttempt" payload={{attemptId:attempt.id,orderVersion:item.version}} fields={[{name:"reason",label:"Motivo del fallo",required:true}]} label="Registrar fallo"/></details></div>}
   {["finished","delivered","closed"].includes(status)&&<>
    {["delivered","closed"].includes(status)&&<div className="order-delivery-confirmation"><Check/><div><strong className="order-delivered-message">Pedido entregado · {deliveryDate}{closed?" · Cerrado":""}</strong><small>{closed?"Pedido cerrado. Disponible solo para consulta.":"Entrega registrada. Puedes corregir la fecha antes del cierre."}</small></div></div>}
    <div className="order-delivery-grid"><section className="order-delivery-config"><h3><CalendarDays/>Fecha real de entrega</h3>{status==="finished"?<CommandForm command="orders.transition" payload={{orderId:id,expectedVersion:item.version,target:"delivered"}} fields={[{name:"deliveryDate",label:"Fecha real de entrega",type:"date",value:today,required:true}]} label="Registrar entrega"/>:<><p>{deliveryDate}</p>{!closed&&<details className="order-inline-editor"><summary>Corregir fecha de entrega</summary><CommandForm command="orders.updateDeliveryDate" payload={{orderId:id,expectedVersion:item.version}} fields={[{name:"deliveryDate",label:"Fecha real de entrega",type:"date",value:deliveryDate,required:true}]} label="Guardar fecha corregida"/></details>}</>}</section>{status!=="finished"&&<aside className="order-close-panel">
      <h3><LockKeyhole/>Cierre del pedido</h3>
      {closed?<p>Cierre definitivo realizado. Pedido disponible solo para consulta.</p>:<>
       <p>{paid?"Al cerrar, este pedido quedará solo para consulta.":`Registra el saldo pendiente de ${money(item.balance)} en Estado de cuenta comercial para habilitar el cierre.`}</p>
       {paid?<CommandForm command="orders.close" payload={{orderId:id,expectedVersion:item.version}} fields={[{name:"confirmClose",label:"Confirmo el cierre definitivo del pedido",type:"checkbox",required:true}]} label="Cerrar pedido"/>:<Button type="button" disabled>Cerrar pedido</Button>}
      </>}
     </aside>}</div>
   </>}
  </div>

 </section>;
}
