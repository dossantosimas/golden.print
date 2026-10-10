import "server-only";
import sharp from "sharp";
import {and,eq,gte,inArray,sql} from "drizzle-orm";
import {quoteImageAssets,auditEvents} from "./db/schema";
import {getDb} from "./db";
import {AccessError,type AccessContext} from "./access";
import {mutate} from "./mutations";
import {createHash} from "node:crypto";
import {MAX_IMAGE_UPLOAD_BYTES,MAX_STORED_IMAGE_BYTES,quoteImagesSchema,type QuoteImage} from "./quote-images";

export async function normalizeQuoteImage(bytes:Buffer){
 if(!bytes.length||bytes.length>MAX_IMAGE_UPLOAD_BYTES)throw new AccessError("VALIDATION_ERROR","La imagen supera el tamaño permitido.");
 try{
  const source=sharp(bytes,{limitInputPixels:40_000_000,failOn:"warning"});
  const metadata=await source.metadata();
  if(!["jpeg","png","webp"].includes(metadata.format??"")||(metadata.pages??1)>1)throw new Error("Formato no admitido");
  for(const quality of [82,65,45,30]){
   const output=await source.clone().autoOrient().resize(quality===30?1000:1600,quality===30?1000:1600,{fit:"inside",withoutEnlargement:true}).flatten({background:"#ffffff"}).jpeg({quality}).toBuffer({resolveWithObject:true});
   if(output.data.length<=MAX_STORED_IMAGE_BYTES)return output;
  }
 }catch{throw new AccessError("VALIDATION_ERROR","Selecciona una imagen JPG, PNG o WebP válida.");}
 throw new AccessError("VALIDATION_ERROR","No pudimos optimizar esta imagen. Prueba con una imagen más pequeña.");
}

export async function uploadQuoteImage(ctx:AccessContext,bytes:Buffer,idempotencyKey:string){
 const output=await normalizeQuoteImage(bytes);
 return mutate("quoteImages.upload",{idempotencyKey,fileHash:createHash("sha256").update(bytes).digest("hex")},ctx,async tx=>{
  await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${ctx.organizationId+ctx.userId+"quote-image-quota"},0))`);
  const [recent]=await tx.select({n:sql<number>`count(*)::int`}).from(quoteImageAssets).where(and(eq(quoteImageAssets.orgId,ctx.organizationId),eq(quoteImageAssets.createdBy,ctx.userId),gte(quoteImageAssets.createdAt,new Date(Date.now()-3600_000))));
  if(recent.n>=100)throw new AccessError("RATE_LIMITED","Alcanzaste el límite de cargas por hora. Intenta más tarde.");
  const [asset]=await tx.insert(quoteImageAssets).values({orgId:ctx.organizationId,createdBy:ctx.userId,data:output.data.toString("base64"),width:output.info.width,height:output.info.height}).returning({id:quoteImageAssets.id});
  await tx.insert(auditEvents).values({orgId:ctx.organizationId,actorId:ctx.userId,entityType:"quote_image",entityId:asset.id,action:"quoteImages.upload",metadata:{width:output.info.width,height:output.info.height,bytes:output.data.length}});
  return {id:asset.id,entityType:"quote_image"};
 });
}

export async function commercialQuoteImages(orgId:string,raw:QuoteImage[]){
 const images=quoteImagesSchema.parse(raw);
 if(!images.length)return [];
 const assets=await getDb().select({id:quoteImageAssets.id,data:quoteImageAssets.data}).from(quoteImageAssets).where(and(eq(quoteImageAssets.orgId,orgId),inArray(quoteImageAssets.id,images.map(image=>image.id))));
 return images.map(image=>{
  const asset=assets.find(asset=>asset.id===image.id);
  if(!asset)throw new AccessError("NOT_FOUND","Una imagen de la revisión no está disponible.");
  return {title:image.title,bytes:Buffer.from(asset.data,"base64")};
 });
}
