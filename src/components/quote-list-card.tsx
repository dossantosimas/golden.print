import Link from "next/link";
import {ArrowRight, CalendarDays, Clock, FileText, Layers, Scale} from "lucide-react";
import {Badge} from "@/components/ui/badge";
import {FilamentColor} from "@/components/filament-color";
import {display, money, oneDecimal} from "@/components/display";
import {D} from "@/lib/finance";

export function QuoteListCard({item}:{item:Record<string,unknown>}) {
  const client=String(item.customer??(item.clientSnapshot as {name?:string}|null)?.name??"Sin cliente");
  const materials=(item.cardMaterials??[]) as {grams:string;filamentSnapshot:Record<string,unknown>}[];
  const grams=materials.reduce((sum,line)=>sum.plus(line.grams),new D(0));
  const filament=materials[0]?.filamentSnapshot;
  const seconds=BigInt(String(item.printSeconds??0));
  const duration=`${seconds/3600n} h ${seconds%3600n/60n} min${seconds%60n?` ${seconds%60n} s`:""}`;
  const today=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Bogota",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
  const expired=Boolean(item.validUntil&&String(item.validUntil)<today);
  const status=String(item.status);
  const notes:Record<string,string>={draft:"Pendiente de emitir",sent:"Pendiente de respuesta",accepted:"Confirmada por el cliente",rejected:"Rechazada por el cliente"};
  return <article className="quote-register-card" data-status={status}>
    <div className="quote-register-body">
      <div className="quote-register-heading"><div><Link className="quote-list-code" href={`/cotizaciones/${item.id}`}># {String(item.code)}</Link><h2><Link href={`/cotizaciones/${item.id}`}>{String(item.projectName)}</Link></h2></div><Badge variant="secondary" data-status={status}><span className="quote-state-dot"/>{display(status)}</Badge></div>
      <div className="quote-register-client"><span className="quote-client-avatar" aria-hidden="true">{client.split(/\s+/).slice(0,2).map(w=>w[0]).join("").toUpperCase()}</span><div><strong>{client}</strong><small>Revisión {String(item.revisionNumber)}</small></div>{Boolean(item.validUntil)&&<span className="quote-validity" data-expired={expired}>{expired?"Vigencia vencida":"Válida hasta"}<time dateTime={String(item.validUntil)}>{String(item.validUntil)}</time></span>}</div>
      <dl className="quote-register-specs"><div className="quote-register-filament"><dt><Layers aria-hidden="true"/>Material</dt><dd>{filament?<><span>{[filament.materialType,filament.brand,filament.model].filter(Boolean).join(" · ")}</span>{Boolean(filament.color)&&<FilamentColor value={filament.color}/>}</>:"Sin material"}{materials.length>1&&<small>+ {materials.length-1} material{materials.length>2?"es":""}</small>}</dd></div><div><dt><Scale aria-hidden="true"/>Gramaje</dt><dd>{materials.length?oneDecimal(grams.toString())+" g":"—"}</dd></div><div><dt><Clock aria-hidden="true"/>Impresión estimada</dt><dd>{duration}</dd></div><div><dt><CalendarDays aria-hidden="true"/>Fecha comercial</dt><dd><time dateTime={String(item.businessDate)}>{String(item.businessDate)}</time></dd></div></dl>
      <div className="quote-register-price"><div><span className="quote-register-note">{notes[status]??display(status)}</span><span>Total cotización</span></div><strong>{money(item.selectedPrice)}<small>COP</small></strong></div>
    </div>
    <footer className="quote-register-footer">{item.revisionId&&item.selectedPrice!=null?<a className="quote-register-pdf" aria-label={"Descargar PDF "+item.code} title="Descargar PDF" href={`/api/quotes/${item.id}/revisions/${item.revisionId}/pdf`} target="_blank" rel="noreferrer"><FileText aria-hidden="true"/></a>:<span/>}<Link className="quote-register-detail" href={`/cotizaciones/${item.id}`}>Ver detalle<ArrowRight aria-hidden="true"/></Link></footer>
  </article>;
}


