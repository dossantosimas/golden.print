import {PageHeader} from "@/components/page-header";
import Link from "next/link";
import Form from "next/form";
import {Users,Package,FileText,TrendingUp,Search,ArrowRight,ChevronLeft,ChevronRight,MessageCircle,Mail,Info,UserPlus} from "lucide-react";
import {getWorkspaceData} from "@/lib/app-service";
import {CommandForm} from "@/components/command-form";
import {CustomerListControls} from "@/components/customer-list-controls";
import {Button} from "@/components/ui/button";
import {Card,CardHeader,CardTitle,CardContent} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Alert,AlertTitle,AlertDescription} from "@/components/ui/alert";
import {InputGroup,InputGroupInput,InputGroupAddon} from "@/components/ui/input-group";
import {Table,TableHeader,TableBody,TableHead,TableRow,TableCell} from "@/components/ui/table";
import {money} from "@/components/display";

type Customer=Record<string,unknown>;
function initials(name:unknown){return String(name).trim().split(/\s+/).slice(0,2).map(part=>part[0]).join("").toUpperCase();}
function CustomerName({item}:{item:Customer}){
 return <div className="customer-identity"><span className="customer-avatar" data-active={Number(item.activeOrders)>0}>{initials(item.name)}</span><div><Link href={`/clientes/${item.id}`}>{String(item.name)}</Link><small>{item.socialHandle?String(item.socialHandle):item.lastOrder?`Último pedido · ${item.lastOrder}`:"Sin pedidos registrados"}</small></div></div>;
}
function Contact({item}:{item:Customer}){
 const digits=String(item.contactPhone??"").replace(/\D/g,""),number=digits.length===10?"57"+digits:digits;
 return <div className="customer-contact"><span>{String(item.contactPhone||"—")}</span>{/^\d{11,15}$/.test(number)&&<a href={`https://wa.me/${number}`} target="_blank" rel="noopener noreferrer" aria-label={`Abrir WhatsApp de ${item.name}`}><MessageCircle aria-hidden="true"/></a>}</div>;
}
function History({item}:{item:Customer}){
 const active=Number(item.activeOrders??0),pending=Number(item.pendingQuotes??0),total=Number(item.orderCount??0);
 return <div className="customer-history"><Badge variant="outline" data-tone={active?"warning":"neutral"}>{active?`${active} ${active===1?"pedido activo":"pedidos activos"}`:`${total} ${total===1?"pedido":"pedidos"}`}</Badge>{pending>0?<small data-tone="info">{pending} {pending===1?"cotización pendiente":"cotizaciones pendientes"}</small>:active===0&&total>0?<small data-tone="positive">Sin pendientes</small>:<small>{Number(item.quoteCount??0)} cotizaciones</small>}</div>;
}
function Open({item}:{item:Customer}){return <Link className="customer-open" href={`/clientes/${item.id}`} aria-label={`Abrir cliente ${item.name}`}>Abrir<ArrowRight aria-hidden="true"/></Link>;}

export async function CustomersList({q="",page="1",sort="date",view="table"}:{q?:string;page?:string;sort?:string;view?:string}){
 let data;try{data=await getWorkspaceData("customers",q,"",{page:Number(page),sort,limit:25});}catch{return <Alert variant="destructive"><AlertTitle>No pudimos cargar los clientes</AlertTitle><AlertDescription>Intenta de nuevo.</AlertDescription><Link href="/clientes">Reintentar</Link></Alert>;}
 const m=data.metrics??{},current=data.page??1,pages=data.pages??1,admin=data.access.role==="administrator";
 const href=(next:number)=>"?"+new URLSearchParams({q,sort,view,page:String(next)}).toString();
 const indicators=[{label:"Total clientes",value:String(m.customers??0),detail:"Directorio de tu empresa",tone:"gold",icon:Users},
  {label:"Con pedidos activos",value:String(m.withActiveOrders??0),detail:"Clientes con pedidos por completar",tone:"warning",icon:Package},
  {label:"Cotizaciones pendientes",value:String(m.pendingQuotes??0),detail:"Borradores y enviadas por aceptar",tone:"info",icon:FileText},
  {label:admin?"Ticket promedio":"Con cotizaciones",value:admin?money(m.averageTicket):String(m.withQuotes??0),detail:admin?"Por pedido entregado · COP":"Clientes con cotizaciones registradas",tone:"positive",icon:TrendingUp}];
 return <div className={`customers-page ${view==="cards"?"customer-view-cards":"customer-view-table"}`}>
  <PageHeader title="Clientes" breadcrumbs={[{label:"Clientes"}]} badges={<Badge variant="secondary">{String(m.customers??data.total)} registrados</Badge>} actions={<Button variant="outline" render={<a href="#nuevo-cliente"/>} nativeButton={false}><UserPlus/>Nuevo cliente</Button>}/>
  <section className="customer-indicators" aria-label="Indicadores de clientes">{indicators.map(({label,value,detail,tone,icon:Icon},index)=><article key={label} data-tone={tone}><header><h2>{label}</h2><span><Icon aria-hidden="true"/></span></header><div><strong>{value}</strong>{index===0&&Number(m.newThisMonth)>0&&<small>+{String(m.newThisMonth)} este mes</small>}</div><p>{detail}</p></article>)}</section>
  <div className="customers-workspace"><section className="customer-directory" aria-label="Directorio de clientes">
   <div className="customer-toolbar"><Form action="/clientes" scroll={false} role="search" className="customer-search"><label className="sr-only" htmlFor="customer-search">Buscar clientes</label><InputGroup><InputGroupAddon><Search/></InputGroupAddon><InputGroupInput key={q} id="customer-search" name="q" placeholder="Buscar por nombre, teléfono o correo" defaultValue={q}/></InputGroup><input type="hidden" name="view" value={view}/><input type="hidden" name="sort" value={sort}/><Button type="submit" variant="outline">Buscar</Button>{q&&<Link scroll={false} href={`?${new URLSearchParams({sort,view})}`}>Limpiar</Link>}</Form><CustomerListControls/></div>
   <div className="customer-results"><div className="customer-result-heading"><h2>Directorio de clientes</h2><span>{data.total} {q?"encontrados":"clientes"}</span></div>
    {!data.items.length?<div className="customer-empty"><Users/><h3>{q?"No encontramos clientes":"Tu primer cliente empieza aquí"}</h3><p>{q?"Prueba otro nombre, teléfono o correo.":"Registra sus datos para vincular cotizaciones y pedidos."}</p></div>:<>
     <div className="customer-table-wrap" role="region" aria-label="Tabla de clientes" tabIndex={0}><Table><TableHeader><TableRow>{["Cliente","Teléfono / WhatsApp","Correo electrónico","Historial / Estado","Detalle"].map(label=><TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader><TableBody>{data.items.map(item=><TableRow key={String(item.id)}><TableCell><CustomerName item={item}/></TableCell><TableCell><Contact item={item}/></TableCell><TableCell><span className="customer-email">{String(item.email||"Sin correo")}</span></TableCell><TableCell><History item={item}/></TableCell><TableCell><Open item={item}/></TableCell></TableRow>)}</TableBody></Table></div>
     <div className="customer-cards">{data.items.map(item=><article key={String(item.id)}><CustomerName item={item}/><History item={item}/><Contact item={item}/><p><Mail aria-hidden="true"/>{String(item.email||"Sin correo registrado")}</p><footer><span>{Number(item.orderCount??0)} pedidos en total</span><Open item={item}/></footer></article>)}</div>
    </>}
    <nav className="customer-pagination" aria-label="Paginación de clientes"><Button variant="outline" disabled={current<=1} render={<Link href={href(current-1)}/>} nativeButton={false}><ChevronLeft/>Anterior</Button><span>Página {current} de {pages}</span><Button variant="outline" disabled={current>=pages} render={<Link href={href(current+1)}/>} nativeButton={false}>Siguiente<ChevronRight/></Button></nav>
   </div>
   <div className="customer-help"><Info aria-hidden="true"/><p><strong>Todo el historial en un lugar.</strong> Abre un cliente para consultar sus datos, cotizaciones y pedidos.</p></div>
  </section><Card className="customer-create" id="nuevo-cliente"><CardHeader><div><CardTitle><span/>Nuevo cliente</CardTitle><Badge variant="outline">Registro rápido</Badge></div><p>Los campos con <span>*</span> son obligatorios.</p></CardHeader><CardContent><CommandForm command="customers.create" label="Guardar cliente" fields={[{name:"name",label:"Nombre",required:true},{name:"contactPhone",label:"Teléfono",type:"tel"},{name:"email",label:"Correo electrónico",type:"email"},{name:"socialHandle",label:"Red social / Canal de contacto"},{name:"address",label:"Dirección de entrega"},{name:"notes",label:"Notas / Preferencias",type:"textarea"}]}/></CardContent></Card></div>
 </div>;
}
