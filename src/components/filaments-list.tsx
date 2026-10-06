import {PageHeader} from "@/components/page-header";
import Link from "next/link";
import {CircleDashed,Scale,Coins,Layers,Search,Plus,ArrowRight,ChevronLeft,ChevronRight,Info} from "lucide-react";
import {getWorkspaceData} from "@/lib/app-service";
import {oneDecimal,unitMoney,money} from "@/components/display";
import {FilamentColor} from "@/components/filament-color";
import {FilamentCreate} from "@/components/filament-create";
import {FilamentListControls} from "@/components/filament-list-controls";
import {Card,CardHeader,CardTitle,CardContent} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Alert,AlertTitle,AlertDescription} from "@/components/ui/alert";
import {InputGroup,InputGroupInput,InputGroupAddon} from "@/components/ui/input-group";
import {Table,TableHeader,TableBody,TableHead,TableRow,TableCell} from "@/components/ui/table";

export async function FilamentsList({q="",filter="",page="1",sort="date",view="cards"}:{q?:string;filter?:string;page?:string;sort?:string;view?:string}){
 let data;try{data=await getWorkspaceData("filaments",q,filter,{page:Number(page),sort,limit:25});}catch{return <Alert variant="destructive"><AlertTitle>No pudimos cargar los filamentos</AlertTitle><AlertDescription>Intenta de nuevo.</AlertDescription><Link href="/filamentos">Reintentar</Link></Alert>;}
 const m=data.metrics??{},materials=m.materialTypes as string[]??[],current=data.page??1,pages=data.pages??1;
 const href=(next:number)=>"?"+new URLSearchParams({q,filter,sort,view,page:String(next)}).toString();
 const kpis=[{label:"Filamentos en catálogo",value:String(m.catalogCount??0),detail:"Disponibles para cotizar",tone:"gold",icon:CircleDashed},
 {label:"Peso registrado",value:`${oneDecimal(m.registeredWeight)} g`,detail:"Peso original de los rollos del catálogo",tone:"info",icon:Scale},
 {label:"Costo promedio / g",value:m.averageUnitCost==null?"—":unitMoney(m.averageUnitCost),detail:m.minimumUnitCost==null?"Agrega un filamento para calcularlo":`Mín. ${unitMoney(m.minimumUnitCost)} · Máx. ${unitMoney(m.maximumUnitCost)}`,tone:"gold",icon:Coins},
 {label:"Material principal",value:String(m.principalMaterial??"—"),detail:m.principalShare==null?"Sin materiales registrados":`${m.principalShare}% del catálogo`,tone:"positive",icon:Layers}];
 return <div className={`customers-page filaments-page ${view==="table"?"filament-view-table":"filament-view-cards"}`}>
 <PageHeader title="Filamentos y materiales" breadcrumbs={[{label:"Filamentos"}]} badges={<Badge variant="secondary">{String(m.catalogCount??0)} registrados</Badge>} actions={<Button variant="outline" render={<a href="#nuevo-filamento"/>} nativeButton={false}><Plus/>Nuevo filamento</Button>}/>
 <section className="customer-indicators filament-indicators" aria-label="Indicadores de materiales">{kpis.map(({label,value,detail,tone,icon:Icon})=><article key={label} data-tone={tone}><header><h2>{label}</h2><span><Icon aria-hidden="true"/></span></header><div><strong>{value}</strong></div><p>{detail}</p></article>)}</section>
 <div className="customers-workspace"><section className="filament-catalog" aria-label="Catálogo de filamentos">
 <div className="filament-toolbar"><form className="customer-search" role="search"><label htmlFor="filament-search" className="sr-only">Buscar filamentos</label><InputGroup><InputGroupAddon><Search/></InputGroupAddon><InputGroupInput id="filament-search" name="q" defaultValue={q} placeholder="Buscar por marca, modelo, material o color"/></InputGroup><input type="hidden" name="view" value={view}/><input type="hidden" name="filter" value={filter}/><input type="hidden" name="sort" value={sort}/><Button variant="outline" type="submit">Buscar</Button>{q&&<Link href={`?${new URLSearchParams({filter,sort,view})}`}>Limpiar</Link>}</form><FilamentListControls materials={materials}/></div>
 <div className="customer-results"><div className="customer-result-heading"><h2>Catálogo de materiales</h2><span>{data.total} {q||filter?"encontrados":"filamentos"}</span></div>
 {!data.items.length?<div className="customer-empty"><Layers/><h3>{q||filter?"Sin materiales con esos filtros":"Agrega tu primer filamento"}</h3><p>{q||filter?"Cambia el material o prueba otra búsqueda.":"Registra el rollo para calcular su costo por gramo."}</p></div>:<>
 <div className="filament-catalog-cards">{data.items.map(f=><article key={String(f.id)}><header><div><h2>{String(f.brand)}</h2><p>{String(f.model)}</p></div><Badge variant="outline">{String(f.materialType)}</Badge></header><div className="filament-card-color"><FilamentColor value={f.color}/></div><div className="filament-unit-banner"><span>Costo unitario</span><strong>{unitMoney(f.pricePerGram)}</strong></div><dl><div><dt>Peso del rollo</dt><dd>{oneDecimal(f.rollWeightG)} g</dd></div><div><dt>Precio del rollo</dt><dd>{money(f.purchaseValue)}</dd></div></dl><footer><span><span/>En catálogo</span><Link href={`/filamentos/${f.id}`}>Abrir detalle<ArrowRight aria-hidden="true"/></Link></footer></article>)}</div>
 <div className="filament-catalog-table customer-table-wrap" role="region" aria-label="Tabla de filamentos" tabIndex={0}><Table><TableHeader><TableRow>{["Marca / Modelo","Material","Color","Peso del rollo","COP / g","Detalle"].map(label=><TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader><TableBody>{data.items.map(f=><TableRow key={String(f.id)}><TableCell><strong>{String(f.brand)}</strong><small>{String(f.model)}</small></TableCell><TableCell><Badge variant="outline">{String(f.materialType)}</Badge></TableCell><TableCell><FilamentColor value={f.color}/></TableCell><TableCell>{oneDecimal(f.rollWeightG)} g</TableCell><TableCell><strong className="filament-unit-price">{unitMoney(f.pricePerGram)}</strong></TableCell><TableCell><Link className="customer-open" href={`/filamentos/${f.id}`} aria-label={`Abrir filamento ${f.brand} ${f.model}`}>Abrir<ArrowRight aria-hidden="true"/></Link></TableCell></TableRow>)}</TableBody></Table></div>
 </>}
 <nav className="customer-pagination" aria-label="Paginación de filamentos"><Button variant="outline" disabled={current<=1} render={<Link href={href(current-1)}/>} nativeButton={false}><ChevronLeft/>Anterior</Button><span>Página {current} de {pages}</span><Button variant="outline" disabled={current>=pages} render={<Link href={href(current+1)}/>} nativeButton={false}>Siguiente<ChevronRight/></Button></nav></div>
 <div className="customer-help"><Info aria-hidden="true"/><p><strong>Tarifas para tus cotizaciones.</strong> El costo por gramo se calcula con el precio y peso del rollo. Puedes ajustarlo al cotizar.</p></div>
 </section><Card id="nuevo-filamento" className="customer-create filament-create"><CardHeader><div><CardTitle><span/>Nuevo filamento</CardTitle><Plus aria-hidden="true"/></div><p>Registra marca, material, color y costo del rollo. Los campos con <span>*</span> son obligatorios.</p></CardHeader><CardContent><FilamentCreate/></CardContent></Card></div></div>;
}
