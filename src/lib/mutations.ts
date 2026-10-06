import "server-only";
import {createHash} from "node:crypto";
import {and,eq,gt,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb,type DbTransaction} from "./db";
import {memberships,mutationRequests,session} from "./db/schema";
import {AccessError,type AccessContext} from "./access";
import {serialize} from "./serialization";
export type CommandInput=Record<string,unknown>;
function canonical(v:unknown):string {if(Array.isArray(v))return "["+v.map(canonical).join(",")+"]";if(v&&typeof v==="object")return "{"+Object.keys(v).sort().map(k=>JSON.stringify(k)+":"+canonical((v as Record<string,unknown>)[k])).join(",")+"}";return JSON.stringify(v)??"null";}
export async function mutate(command:string,input:CommandInput,ctx:AccessContext,handler:(tx:DbTransaction)=>Promise<Record<string,unknown>>){
 const key=z.string().uuid().parse(input.idempotencyKey),hash=createHash("sha256").update(canonical(input)).digest("hex");
 return getDb().transaction(async tx=>{
  // Lock membership before domain resources, including replay: disabled users never replay data.
  const [member]=await tx.select().from(memberships).where(and(eq(memberships.userId,ctx.userId),eq(memberships.organizationId,ctx.organizationId))).for("share");
  if(!member?.active||member.role!==ctx.role)throw new AccessError("FORBIDDEN","Tu acceso cambió. Vuelve a iniciar sesión.");
  const [currentSession]=await tx.select({id:session.id}).from(session).where(and(eq(session.id,ctx.sessionId),eq(session.userId,ctx.userId),gt(session.expiresAt,new Date()))).for("share");
  if(!currentSession)throw new AccessError("UNAUTHENTICATED","La sesión fue revocada. Vuelve a iniciar sesión.");
  await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${ctx.organizationId+ctx.userId+command+key},0))`);
  const [prior]=await tx.select().from(mutationRequests).where(and(eq(mutationRequests.orgId,ctx.organizationId),eq(mutationRequests.actorId,ctx.userId),eq(mutationRequests.operation,command),eq(mutationRequests.idempotencyKey,key)));
  if(prior){if(prior.inputHash!==hash)throw new AccessError("IDEMPOTENCY_CONFLICT","Esta solicitud ya se usó con otros datos.");return {id:prior.resultEntityId,entityType:prior.resultEntityType,replayed:true};}
  const result=serialize(await handler(tx));
  const id=z.string().uuid().parse(result.id);
  await tx.insert(mutationRequests).values({orgId:ctx.organizationId,actorId:ctx.userId,operation:command,idempotencyKey:key,inputHash:hash,resultEntityType:String(result.entityType??command.split(".")[0]),resultEntityId:id,resultStatus:"completed"});
  return result;
 });
}
