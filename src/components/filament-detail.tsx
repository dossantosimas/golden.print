import {PageHeader} from "@/components/page-header";
import Link from "next/link";
import {Layers,Weight,Coins,Calculator,Info,SlidersHorizontal,CircleCheck,Archive} from "lucide-react";
import {getEntityDetail} from "@/lib/app-service";
import {money,oneDecimal,unitMoney} from "@/components/display";
import {FilamentColor} from "@/components/filament-color";
import {FilamentEditor} from "@/components/filament-editor";
import {Alert,AlertTitle,AlertDescription} from "@/components/ui/alert";

export async function FilamentDetail({id}:{id:string}){
 let data;try{data=await getEntityDetail("filaments",id);}catch{return <Alert variant="destructive"><AlertTitle>No pudimos cargar el filamento</AlertTitle><AlertDescription>Vuelve al catálogo e intenta de nuevo.</AlertDescription></Alert>;}
 const {item}=data,archived=Boolean(item.archivedAt);
 return <div className="filament-detail-page">
  
  <PageHeader title={String(item.brand)+" / "+String(item.model)} breadcrumbs={[{label:"Filamentos",href:"/filamentos"},{label:"Detalle del filamento"}]} badges={<div className="filament-detail-tags"><span>{String(item.materialType)}</span><FilamentColor value={item.color}/><span className={archived?"filament-state archived":"filament-state"}>{archived?<Archive aria-hidden="true"/>:<CircleCheck aria-hidden="true"/>}{archived?"Archivado":"Activo en el catálogo"}</span></div>}/>
  <section className="filament-detail-metrics" aria-label="Valores del filamento">
   <article><div><span>Peso original del rollo</span><Weight aria-hidden="true"/></div><strong>{oneDecimal(item.rollWeightG)} <small>g</small></strong><p>Peso registrado en la ficha</p></article>
   <article className="filament-metric-gold"><div><span>Costo por gramo</span><Calculator aria-hidden="true"/></div><strong>{unitMoney(item.pricePerGram)}</strong><p>Valor disponible para cotizar</p></article>
   <article><div><span>Precio del rollo</span><Coins aria-hidden="true"/></div><strong>{money(item.purchaseValue)} <small>COP</small></strong><p>Valor de compra registrado</p></article>
   <article><div><span>Material y color</span><Layers aria-hidden="true"/></div><strong>{String(item.materialType)}</strong><FilamentColor value={item.color}/></article>
  </section>
  <div className="filament-detail-grid">
   <section className="filament-detail-sheet"><header><div><Layers aria-hidden="true"/><h2>Ficha del filamento</h2></div><span>Datos del catálogo</span></header>
    <dl><div><dt>Marca</dt><dd>{String(item.brand)}</dd></div><div><dt>Modelo</dt><dd>{String(item.model)}</dd></div><div><dt>Tipo de material</dt><dd>{String(item.materialType)}</dd></div><div><dt>Color y tonalidad</dt><dd><FilamentColor value={item.color}/></dd></div><div><dt>Peso original del rollo</dt><dd>{oneDecimal(item.rollWeightG)} g</dd></div><div><dt>Precio de compra</dt><dd>{money(item.purchaseValue)} COP</dd></div></dl>
    <div className="filament-detail-cost"><Calculator aria-hidden="true"/><div><span>Costo del material para tus cotizaciones</span><strong>{unitMoney(item.pricePerGram)}</strong><p>{money(item.purchaseValue)} ÷ {oneDecimal(item.rollWeightG)} g</p></div></div>
    <div className="filament-detail-note"><Info aria-hidden="true"/><p>Al guardar, el nuevo costo por gramo estará disponible para las próximas cotizaciones. Las cotizaciones guardadas conservan sus precios originales.</p></div>
   </section>
   <section className="filament-detail-edit"><header><div><SlidersHorizontal aria-hidden="true"/><h2>{archived?"Ficha archivada":"Editar ficha de filamento"}</h2></div>{!archived&&<span>* Obligatorios</span>}</header>{archived?<p className="filament-archived-message">Este filamento se conserva como referencia de las cotizaciones existentes.</p>:<FilamentEditor key={String(item.version)} item={item}/>}</section>
  </div>
 </div>;
}
