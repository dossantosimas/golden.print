import {and,eq} from "drizzle-orm";
import {z} from "zod";
import {AccessError,requireAccess} from "@/lib/access";
import {getDb} from "@/lib/db";
import {quoteImageAssets} from "@/lib/db/schema";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const access=await requireAccess(),id=z.uuid().parse((await params).id);
  const [image]=await getDb().select({data:quoteImageAssets.data}).from(quoteImageAssets).where(and(eq(quoteImageAssets.orgId,access.organizationId),eq(quoteImageAssets.id,id))).limit(1);
  if(!image)throw new AccessError("NOT_FOUND","Imagen no encontrada.");
  return new Response(new Uint8Array(Buffer.from(image.data,"base64")),{headers:{"Content-Type":"image/jpeg","Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
 }catch(error){
  const code=error instanceof AccessError?error.code:"NOT_FOUND";
  return Response.json({message:"Imagen no disponible."},{status:code==="UNAUTHENTICATED"?401:code==="FORBIDDEN"?403:404,headers:{"Cache-Control":"private, no-store"}});
 }
}
