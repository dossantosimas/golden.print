import {z} from "zod";
import {requireAccess,AccessError} from "@/lib/access";
import {uploadQuoteImage} from "@/lib/quote-image-service";
import {MAX_IMAGE_UPLOAD_BYTES} from "@/lib/quote-images";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function POST(request:Request){
 try{
  const access=await requireAccess();
  if(request.headers.get("origin")!==new URL(request.url).origin)throw new AccessError("FORBIDDEN","Origen de carga no permitido.");
  if(Number(request.headers.get("content-length")??0)>MAX_IMAGE_UPLOAD_BYTES+65536)throw new AccessError("VALIDATION_ERROR","La imagen supera el tamaño permitido.");
  const form=await request.formData(),file=form.get("image"),key=z.uuid().parse(form.get("idempotencyKey"));
  if(!(file instanceof File)||!file.size||file.size>MAX_IMAGE_UPLOAD_BYTES)throw new AccessError("VALIDATION_ERROR","Selecciona una imagen válida.");
  const data=await uploadQuoteImage(access,Buffer.from(await file.arrayBuffer()),key);
  return Response.json({ok:true,id:data.id},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  const code=error instanceof AccessError?error.code:error instanceof z.ZodError?"VALIDATION_ERROR":"INTERNAL_ERROR";
  const status=code==="UNAUTHENTICATED"?401:code==="FORBIDDEN"?403:code==="VALIDATION_ERROR"?400:code==="RATE_LIMITED"?429:503;
  return Response.json({ok:false,message:error instanceof AccessError?error.message:"No pudimos subir la imagen. Intenta de nuevo."},{status,headers:{"Cache-Control":"private, no-store"}});
 }
}
