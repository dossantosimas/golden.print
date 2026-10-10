"use client";

import {useRef,useState} from "react";
import Image from "next/image";
import {ImagePlus,Trash2} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Field,FieldLabel} from "@/components/ui/field";
import {Card,CardHeader,CardTitle,CardDescription,CardContent} from "@/components/ui/card";
import {Spinner} from "@/components/ui/spinner";
import {MAX_QUOTE_IMAGES,MAX_IMAGE_UPLOAD_BYTES,quoteImageUrl,type QuoteImage} from "@/lib/quote-images";

async function prepare(file:File){
 if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>20*1024*1024)throw new Error("Elige imágenes JPG, PNG o WebP de hasta 20 MB.");
 let bitmap:ImageBitmap;
 try{bitmap=await createImageBitmap(file);}catch{throw new Error("No pudimos leer la imagen. Elige un archivo JPG, PNG o WebP válido.");}
 try{
  if(bitmap.width*bitmap.height>40_000_000)throw new Error("La imagen es demasiado grande. Usa una foto de hasta 40 megapíxeles.");
  const scale=Math.min(1,1600/bitmap.width,1600/bitmap.height),canvas=document.createElement("canvas");
  canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
  const ctx=canvas.getContext("2d");if(!ctx)throw new Error("No pudimos preparar la imagen.");
  ctx.fillStyle="#fff";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
  const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error("No pudimos preparar la imagen.")),"image/jpeg",.85));
  if(blob.size>MAX_IMAGE_UPLOAD_BYTES)throw new Error("La imagen sigue siendo demasiado grande. Prueba con otra más pequeña.");
  return blob;
 }finally{bitmap.close();}
}

export function QuoteImagesEditor({images,onChange,onBusy,disabled=false}:{images:QuoteImage[];onChange:(images:QuoteImage[])=>void;onBusy:(busy:boolean)=>void;disabled?:boolean}){
 const picker=useRef<HTMLInputElement>(null),uploading=useRef(false);
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 async function add(files:File[]){
  if(uploading.current||disabled||!files.length)return;
  setError("");
  if(images.length+files.length>MAX_QUOTE_IMAGES){setError(`Puedes agregar máximo 10 imágenes. Quedan ${MAX_QUOTE_IMAGES-images.length} espacios.`);return;}
  uploading.current=true;setBusy(true);onBusy(true);
  const uploaded:QuoteImage[]=[];
  try{
   for(const file of files){
    const form=new FormData();form.set("image",await prepare(file),"image.jpg");form.set("idempotencyKey",crypto.randomUUID());
    const response=await fetch("/api/quote-images",{method:"POST",body:form,credentials:"same-origin"});
    const data=await response.json();
    if(!response.ok||!data.ok)throw new Error(data.message??"No pudimos subir la imagen.");
    uploaded.push({id:data.id,title:""});onChange([...images,...uploaded]);
   }
  }catch(error){setError(error instanceof Error?error.message:"No pudimos subir la imagen. Intenta de nuevo.");}
  finally{uploading.current=false;setBusy(false);onBusy(false);}
 }
 return <Card className="col-span-full"><CardHeader><CardTitle>Imágenes de la cotización</CardTitle><CardDescription>Hasta 10 imágenes. Puedes agregar un título a cada una; aparecerán en el PDF.</CardDescription></CardHeader><CardContent className="flex flex-col gap-4">
  <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground" aria-live="polite">{images.length} de 10 imágenes</p><input ref={picker} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple aria-label="Seleccionar imágenes de la cotización" disabled={disabled||busy||images.length>=MAX_QUOTE_IMAGES} onChange={event=>{const files=Array.from(event.target.files??[]);event.target.value="";void add(files);}}/><Button type="button" variant="outline" disabled={disabled||busy||images.length>=MAX_QUOTE_IMAGES} onClick={()=>picker.current?.click()}>{busy?<Spinner/>:<ImagePlus/>}{busy?"Subiendo imágenes…":"Agregar imágenes"}</Button></div>
  {!images.length&&<p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Agrega fotos o referencias del proyecto.</p>}
  <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{images.map((image,index)=><div key={image.id} className="min-w-0 rounded-lg border bg-background p-3"><Image src={quoteImageUrl(image.id)} alt={image.title||`Imagen ${index+1} de la cotización`} width={400} height={300} unoptimized className="mb-3 h-36 w-full rounded-md bg-muted/40 object-contain"/><Field><FieldLabel htmlFor={`image-title-${image.id}`}>Título de imagen {index+1}</FieldLabel><Input id={`image-title-${image.id}`} maxLength={120} placeholder="Ej. Vista frontal" value={image.title} disabled={disabled||busy} onChange={event=>onChange(images.map(item=>item.id===image.id?{...item,title:event.target.value}:item))}/></Field><Button type="button" variant="ghost" size="sm" className="mt-2" disabled={disabled||busy} onClick={()=>{onChange(images.filter(item=>item.id!==image.id));setError("");}} aria-label={`Quitar imagen ${index+1}`}><Trash2/>Quitar imagen</Button></div>)}</div>
  {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
 </CardContent></Card>;
}
