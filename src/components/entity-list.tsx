import Link from "next/link";
import {FilamentColor} from "@/components/filament-color";

import {ListControls} from "@/components/list-controls";

import { getWorkspaceData } from "@/lib/app-service";

import { CommandForm, type FormField } from "@/components/command-form";

import { Button } from "@/components/ui/button";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

import { Table,TableHeader,TableBody,TableHead,TableRow,TableCell } from "@/components/ui/table";

import { Badge } from "@/components/ui/badge";

import { Alert,AlertTitle,AlertDescription } from "@/components/ui/alert";

import { InputGroup, InputGroupInput, InputGroupAddon } from "@/components/ui/input-group";

import {Search, Plus, ArrowRight, ChevronLeft, ChevronRight, FolderOpen} from "lucide-react";

import { Empty,EmptyHeader,EmptyTitle,EmptyDescription,EmptyMedia } from "@/components/ui/empty";

import {money,display,unitMoney,oneDecimal} from "@/components/display";

export type ListConfig={entity:string;title:string;createLabel?:string;fields?:FormField[]|null;columns:{key:string;label:string;money?:boolean}[];detailPath?:string;createPath?:string|null;description?:string};

export async function EntityList({config,q="",filter="",page="1",sort="date",view="table"}:{config:ListConfig;q?:string;filter?:string;page?:string;sort?:string;view?:string}){

 let data;try{data=await getWorkspaceData(config.entity,q,filter,{page:Number(page),sort,limit:25});}catch{return <><h1>{config.title}</h1><Alert variant="destructive"><AlertTitle>No pudimos cargar {config.title.toLowerCase()}</AlertTitle><AlertDescription>{"Intenta de nuevo o solicita ayuda al administrador."}</AlertDescription></Alert><Button render={<Link href={`?q=${encodeURIComponent(q)}`} />} nativeButton={false} variant="outline">Reintentar</Button></>;}

 const formFields=config.entity==="expenses"&&config.fields?[...config.fields,{name:"responsibleUserId",label:"Responsable",value:data.access.userId,required:true,options:(await getWorkspaceData("users")).items.filter(u=>u.active).map(u=>({value:String(u.userId??u.id),label:String(u.name)}))}]:config.fields;

 return <div className={view==="cards"?"record-list flex flex-col gap-6 force-cards":"record-list flex flex-col gap-6 force-table"}><div className="page-heading"><div><p className="eyebrow">Gestión del taller</p><h1>{config.title}</h1>{config.description&&<p className="text-muted-foreground">{config.description}</p>}</div>{config.createPath&&<Button render={<Link href={config.createPath} />} nativeButton={false}><Plus data-icon="inline-start"/>{config.createLabel}</Button>}</div><div className={config.fields?"list-with-form":""}><section aria-label={config.title} className="min-w-0"><Card className="records-surface"><CardHeader className="records-header"><CardTitle>{config.title} <Badge variant="secondary">{data.total}</Badge></CardTitle></CardHeader><CardContent><div className="record-toolbar"><form className="list-search" role="search"><label htmlFor="list-search" className="sr-only">Buscar en {config.title}</label><InputGroup><InputGroupAddon><Search/></InputGroupAddon><InputGroupInput name="q" id="list-search" placeholder="Buscar por nombre o código" defaultValue={q}/></InputGroup><input type="hidden" name="filter" value={filter}/><input type="hidden" name="view" value={view}/><input type="hidden" name="sort" value={sort}/><Button variant="outline" type="submit">Buscar</Button>{q&&<Button render={<Link href="?" />} nativeButton={false} variant="ghost">Limpiar</Button>}</form><ListControls entity={config.entity}/></div>{data.items.length===0?<Empty className="record-empty"><EmptyHeader><EmptyMedia variant="icon"><FolderOpen/></EmptyMedia><EmptyTitle>{q?"Sin coincidencias":"Aún no hay registros"}</EmptyTitle><EmptyDescription>{q?"Prueba otra búsqueda.":"Agrega el primero para comenzar."}</EmptyDescription></EmptyHeader></Empty>:<><div className="desktop-table" role="region" aria-label={`Tabla de ${config.title.toLowerCase()}`} tabIndex={0}><Table><TableHeader><TableRow>{config.columns.map(c=><TableHead key={c.key}>{c.label}</TableHead>)}{config.detailPath&&<TableHead>Detalle</TableHead>}</TableRow></TableHeader><TableBody>{data.items.map(item=><TableRow key={String(item.id)}>{config.columns.map(c=><TableCell key={c.key}>{c.key==="status"||c.key==="role"?<Badge variant="secondary" data-status={String(item[c.key])}>{display(item[c.key])}</Badge>:c.key==="color"&&config.entity==="filaments"?<FilamentColor value={item[c.key]}/>:["grams","rollWeightG"].includes(c.key)?oneDecimal(item[c.key]):c.key==="pricePerGram"?unitMoney(item[c.key]):c.money?money(item[c.key]):display(item[c.key])}</TableCell>)}{config.detailPath&&<TableCell><Button variant="ghost" size="sm" render={<Link href={`${config.detailPath}/${item.id}`}/>} nativeButton={false}>Abrir<ArrowRight data-icon="inline-end"/></Button></TableCell>}</TableRow>)}</TableBody></Table></div><div className="mobile-records">{data.items.map(item=><article className="mobile-record" data-status={item.status?String(item.status):undefined} key={String(item.id)}>{config.columns.map(c=><div key={c.key}><span className="text-muted-foreground">{c.label}</span><strong>{c.key==="status"?<Badge variant="secondary" data-status={String(item[c.key])}>{display(item[c.key])}</Badge>:c.key==="color"&&config.entity==="filaments"?<FilamentColor value={item[c.key]}/>:["grams","rollWeightG"].includes(c.key)?oneDecimal(item[c.key]):c.key==="pricePerGram"?unitMoney(item[c.key]):c.money?money(item[c.key]):display(item[c.key])}</strong></div>)}{config.detailPath&&<Link className="inline-link" href={`${config.detailPath}/${item.id}`}>Abrir detalle</Link>}</article>)}</div></>}</CardContent></Card><div className="record-pagination"><Button disabled={Number(page)<=1} variant="outline" render={<Link href={"?"+new URLSearchParams({q,filter,view,sort,page:String(Math.max(1,Number(page)-1))}).toString()}/>} nativeButton={false}><ChevronLeft data-icon="inline-start"/>Anterior</Button><span className="text-sm">Página {page} de {Math.max(1,Math.ceil(data.total/25))}</span><Button disabled={Number(page)*25>=data.total} variant="outline" render={<Link href={"?"+new URLSearchParams({q,filter,view,sort,page:String(Number(page)+1)}).toString()}/>} nativeButton={false}>Siguiente<ChevronRight data-icon="inline-end"/></Button></div></section>{config.fields&&<Card className="form-shell catalog-create"><CardHeader><CardTitle>{config.createLabel}</CardTitle><CardDescription>Los campos con * son obligatorios.</CardDescription></CardHeader><CardContent><CommandForm command={`${config.entity}.create`} fields={formFields??[]} payload={config.entity==="expenses"?{responsibleUserId:data.access.userId}:{}}/></CardContent></Card>}</div></div>;

}















