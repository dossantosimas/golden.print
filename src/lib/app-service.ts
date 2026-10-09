import "server-only";
import {and,eq,isNull,desc,asc,or,ilike,inArray,count,sql,gte,lte} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "./db";
import * as s from "./db/schema";
import {requireAccess,AccessError} from "./access";
import {listUsers,createUser,changeRole,deactivate,reactivate,resetCredential,updateName} from "./users";
import {executeCatalogCommand} from "./catalog-service";
import {executeQuoteCommand} from "./quote-service";
import {executeProductionCommand} from "./production-service";
import {mutate,type CommandInput} from "./mutations";
import {reportingData} from "./reporting";
import {serialize} from "./serialization";
import {periodRange} from "./dates";
import {D,quantize} from "./finance";
import type {AccessContext} from "./access";
export type WorkspaceData={items:Record<string,unknown>[];total:number;access:AccessContext;metrics?:Record<string,unknown>;defaults?:Record<string,unknown>;page?:number;pages?:number;cashMovements?:Record<string,unknown>[]};
const adminEntities=new Set(["users","settings","expenses","losses","finance","cash"]);
export async function executeCommand(command:string,input:CommandInput){
 const ctx=await requireAccess((command==="orders.updateCommercial"||command==="orders.archive")||/^(users|settings|payments|expenses|losses|cash)\./.test(command)?"administrator":undefined);
 if(command.startsWith("users.")){const methods={create:createUser,changeRole,deactivate,reactivate,resetCredential,updateName} as const;const fn=methods[command.slice(6) as keyof typeof methods];if(!fn)throw new AccessError("VALIDATION_ERROR","Operación desconocida.");return serialize(await fn(input as never));}
 return mutate(command,input,ctx,tx=>command.startsWith("customers.")||command.startsWith("filaments.")||command.startsWith("settings.")?executeCatalogCommand(command,input,ctx,tx):command.startsWith("quotes.")||command==="orders.convertQuote"||command==="orders.createIntake"||command==="orders.updateMetadata"||command==="orders.updateCommercial"||command==="orders.archive"||command==="orders.deleteUnusedIntake"?executeQuoteCommand(command,input,ctx,tx):executeProductionCommand(command,input,ctx,tx));
}
export async function getFilamentOptions(){
 const ctx=await requireAccess();
 const rows=await getDb().select({id:s.filaments.id,brand:s.filaments.brand,model:s.filaments.model,materialType:s.filaments.materialType,color:s.filaments.color,purchaseValue:s.filaments.purchaseValue,rollWeightG:s.filaments.rollWeightG}).from(s.filaments).where(and(eq(s.filaments.orgId,ctx.organizationId),isNull(s.filaments.archivedAt))).orderBy(asc(s.filaments.brand),asc(s.filaments.id));
 return rows.map(f=>({...f,pricePerGram:quantize(new D(f.purchaseValue).div(f.rollWeightG))}));
}
export async function getProvisionalOrderOptions(){
 const ctx=await requireAccess();
 return getDb().select({id:s.orders.id,code:s.orders.code,title:s.orders.title,customerId:s.orders.customerId}).from(s.orders).where(and(eq(s.orders.orgId,ctx.organizationId),isNull(s.orders.confirmedAt),isNull(s.orders.archivedAt),eq(s.orders.status,"not_started"))).orderBy(desc(s.orders.createdAt));
}
export async function getCustomerOptions(){
 const ctx=await requireAccess();
 return getDb().select({id:s.customers.id,name:s.customers.name,contactPhone:s.customers.contactPhone,email:s.customers.email}).from(s.customers).where(and(eq(s.customers.orgId,ctx.organizationId),isNull(s.customers.archivedAt))).orderBy(asc(s.customers.name),asc(s.customers.id));
}
export async function getWorkspaceData(entity:string,q="",filter="",options:{page?:number;sort?:string;limit?:number;start?:string;end?:string}={}):Promise<WorkspaceData>{
 const ctx=await requireAccess(adminEntities.has(entity)?"administrator":undefined);q=z.string().max(100).parse(q);
 if(entity==="dashboard"||entity==="finance"||entity==="cash")return reportingData(ctx,filter,entity!=="dashboard");
 const db=getDb(),org=ctx.organizationId; let items:Record<string,unknown>[]=[],defaults:Record<string,unknown>|undefined,metrics:Record<string,unknown>|undefined;
 if(entity==="customers"){
 const customers=await db.select().from(s.customers).where(and(eq(s.customers.orgId,org),isNull(s.customers.archivedAt))).orderBy(desc(s.customers.createdAt));
 const [orderStats,quoteStats]=await Promise.all([
 db.select({customerId:s.orders.customerId,total:sql<number>`count(*)::int`,active:sql<number>`count(*) filter (where ${s.orders.status} not in ('delivered','closed'))::int`,lastOrder:sql<string>`max(${s.orders.orderDate})::text`,deliveredTotal:sql<string>`coalesce(sum(${s.orders.agreedPrice}) filter (where ${s.orders.status} in ('delivered','closed')),0)::text`,deliveredCount:sql<number>`count(${s.orders.agreedPrice}) filter (where ${s.orders.status} in ('delivered','closed'))::int`}).from(s.orders).where(and(eq(s.orders.orgId,org),isNull(s.orders.archivedAt))).groupBy(s.orders.customerId),
 db.select({customerId:s.quotes.customerId,total:sql<number>`count(*)::int`,pending:sql<number>`count(*) filter (where ${s.quoteRevisions.status} in ('draft','sent'))::int`}).from(s.quotes).innerJoin(s.quoteRevisions,and(eq(s.quotes.currentRevisionId,s.quoteRevisions.id),eq(s.quoteRevisions.orgId,org))).where(and(eq(s.quotes.orgId,org),isNull(s.quotes.archivedAt))).groupBy(s.quotes.customerId)
 ]);
 const ordersByCustomer=new Map(orderStats.map(r=>[r.customerId,r])),quotesByCustomer=new Map(quoteStats.map(r=>[r.customerId,r]));
 items=customers.map(c=>({...c,orderCount:ordersByCustomer.get(c.id)?.total??0,activeOrders:ordersByCustomer.get(c.id)?.active??0,lastOrder:ordersByCustomer.get(c.id)?.lastOrder??null,quoteCount:quotesByCustomer.get(c.id)?.total??0,pendingQuotes:quotesByCustomer.get(c.id)?.pending??0}));
 const month=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Bogota",year:"numeric",month:"2-digit"}).format(new Date());
 const delivered=customers.reduce((n,c)=>n+(ordersByCustomer.get(c.id)?.deliveredCount??0),0),sales=customers.reduce((n,c)=>n.plus(ordersByCustomer.get(c.id)?.deliveredTotal??0),new D(0));
 metrics={customers:customers.length,newThisMonth:customers.filter(c=>new Intl.DateTimeFormat("en-CA",{timeZone:"America/Bogota",year:"numeric",month:"2-digit"}).format(c.createdAt)===month).length,withActiveOrders:items.filter(c=>Number(c.activeOrders)>0).length,pendingQuotes:items.reduce((n,c)=>n+Number(c.pendingQuotes),0),withQuotes:items.filter(c=>Number(c.quoteCount)>0).length,...(ctx.role==="administrator"?{averageTicket:delivered?quantize(sales.div(delivered)):null}:{})};
 }
 else if(entity==="filaments"){
 items=(await db.select().from(s.filaments).where(and(eq(s.filaments.orgId,org),isNull(s.filaments.archivedAt))).orderBy(desc(s.filaments.createdAt))).map(f=>({...f,name:[f.brand,f.model,f.materialType,f.color].join(" · "),pricePerGram:quantize(new D(f.purchaseValue).div(f.rollWeightG))}));
 const prices=items.map(f=>new D(String(f.pricePerGram))),types=new Map<string,number>();
 for(const f of items){const type=String(f.materialType).trim().toUpperCase();types.set(type,(types.get(type)??0)+1);}
 const dominant=[...types.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0];
 metrics={catalogCount:items.length,registeredWeight:items.reduce((n,f)=>n.plus(String(f.rollWeightG)),new D(0)).toFixed(6),averageUnitCost:prices.length?quantize(prices.reduce((n,p)=>n.plus(p),new D(0)).div(prices.length)):null,minimumUnitCost:prices.length?D.min(...prices).toFixed(6):null,maximumUnitCost:prices.length?D.max(...prices).toFixed(6):null,principalMaterial:dominant?.[0]??null,principalShare:dominant?new D(dominant[1]).div(items.length).times(100).toFixed(0):null,materialTypes:[...types.keys()].sort()};
 } else if(entity==="quotes"){const rows=await db.select({q:s.quotes,r:s.quoteRevisions,c:s.customers.name}).from(s.quotes).leftJoin(s.quoteRevisions,eq(s.quotes.currentRevisionId,s.quoteRevisions.id)).leftJoin(s.customers,eq(s.quotes.customerId,s.customers.id)).where(and(eq(s.quotes.orgId,org),isNull(s.quotes.archivedAt))).orderBy(desc(s.quotes.createdAt));items=rows.map(({q,r,c})=>({...q,...r,id:q.id,quoteId:q.id,revisionId:r?.id,version:q.version,customer:c,selectedPrice:r?.quotedPrice}));}
 else if(entity==="orders"){
 const sort=z.enum(["date","name","amount","date_desc","name_asc","amount_desc"]).parse(options.sort??"date"),limit=z.number().int().min(1).max(100).parse(options.limit??25),requested=z.number().int().positive().parse(options.page??1);
 const orderPeriod=options.start||options.end?periodRange(options.start||undefined,options.end||undefined):null;
 const search=q.replace(/[\\%_]/g,"\\$&");
 const where=and(eq(s.orders.orgId,org),isNull(s.orders.archivedAt),orderPeriod?.startDate?gte(s.orders.orderDate,orderPeriod.startDate):undefined,orderPeriod?lte(s.orders.orderDate,orderPeriod.endDate):undefined,filter?eq(s.orders.status,filter as typeof s.orders.$inferSelect.status):undefined,q?or(ilike(s.orders.code,"%"+search+"%"),ilike(s.orders.title,"%"+search+"%"),ilike(s.customers.name,"%"+search+"%")):undefined);
 const [{total}]=await db.select({total:count()}).from(s.orders).leftJoin(s.customers,eq(s.orders.customerId,s.customers.id)).where(where);
 const pages=Math.max(1,Math.ceil(total/limit)),page=Math.min(requested,pages);
 const ordering=sort.startsWith("name")?asc(s.orders.title):sort.startsWith("amount")?desc(s.orders.agreedPrice):desc(s.orders.createdAt);
 const rows=await db.select({order:s.orders,customer:s.customers.name}).from(s.orders).leftJoin(s.customers,eq(s.orders.customerId,s.customers.id)).where(where).orderBy(ordering,asc(s.orders.id)).limit(limit).offset((page-1)*limit);
 const ids=rows.map(r=>r.order.id);
 const pays=ids.length?await db.select({orderId:s.payments.orderId,amount:s.payments.amount}).from(s.payments).where(and(eq(s.payments.orgId,org),isNull(s.payments.voidedAt),inArray(s.payments.orderId,ids))):[];
 const revisionIds=rows.map(r=>r.order.acceptedRevisionId).filter((id):id is string=>id!==null);
 const revisions=revisionIds.length?await db.select({id:s.quoteRevisions.id,cost:s.quoteRevisions.estimatedCost,printSeconds:s.quoteRevisions.printSeconds}).from(s.quoteRevisions).where(and(eq(s.quoteRevisions.orgId,org),inArray(s.quoteRevisions.id,revisionIds))):[];
 const quotedCosts=new Map(revisions.map(r=>[r.id,r.cost]));
 const quotedTimes=new Map(revisions.map(r=>[r.id,r.printSeconds]));
 const paid=new Map<string,InstanceType<typeof D>>();
 for(const p of pays)paid.set(p.orderId,(paid.get(p.orderId)??new D(0)).plus(p.amount));
 items=rows.map(({order:o,customer})=>{const received=paid.get(o.id)??new D(0),balance=o.agreedPrice===null?null:new D(o.agreedPrice).minus(received).toFixed(0);return {...o,customer,printSeconds:o.acceptedRevisionId?quotedTimes.get(o.acceptedRevisionId)??null:null,receivedAmount:received.toFixed(0),balance,paymentStatus:balance==="0"?"paid":"pending",actualCost:o.acceptedRevisionId?quantize(new D(o.estimatedCostOverride??quotedCosts.get(o.acceptedRevisionId)??0)):null};});
 const [settings]=await db.select().from(s.businessSettings).where(eq(s.businessSettings.organizationId,org));

 const materials=revisionIds.length?await db.select({revisionId:s.quoteMaterials.revisionId,grams:s.quoteMaterials.grams,filamentSnapshot:s.quoteMaterials.filamentSnapshot}).from(s.quoteMaterials).where(and(eq(s.quoteMaterials.orgId,org),inArray(s.quoteMaterials.revisionId,revisionIds))).orderBy(asc(s.quoteMaterials.id)):[];
 for(const item of items)item.cardMaterials=materials.filter(m=>m.revisionId===item.acceptedRevisionId);
 const [totals]=await db.select({active:sql<number>`count(*) filter (where ${s.orders.status} not in ('delivered','closed'))::int`,printing:sql<number>`count(*) filter (where ${s.orders.status} = 'printing')::int`,finished:sql<number>`count(*) filter (where ${s.orders.status} = 'finished')::int`,activeValue:sql<string>`coalesce(sum(${s.orders.agreedPrice}) filter (where ${s.orders.status} not in ('delivered','closed')),0)::text`,agreed:sql<string>`coalesce(sum(${s.orders.agreedPrice}),0)::text`}).from(s.orders).where(and(eq(s.orders.orgId,org),isNull(s.orders.archivedAt)));
 const [collected]=await db.select({amount:sql<string>`coalesce(sum(${s.payments.amount}),0)::text`}).from(s.payments).innerJoin(s.orders,and(eq(s.payments.orderId,s.orders.id),eq(s.payments.orgId,s.orders.orgId))).where(and(eq(s.orders.orgId,org),isNull(s.orders.archivedAt),isNull(s.payments.voidedAt)));
 metrics={...totals,balance:new D(totals.agreed).minus(collected.amount).toFixed(0)};
 return serialize({items,total,page,pages,metrics,access:ctx,defaults:settings});
 }
 else if(entity==="expenses"){
 const range=options.start||options.end?periodRange(options.start||undefined,options.end||undefined):null;
 items=(await db.select({expense:s.expenses,responsible:s.user.name}).from(s.expenses).leftJoin(s.user,eq(s.expenses.responsibleUserId,s.user.id)).where(and(eq(s.expenses.orgId,org),isNull(s.expenses.voidedAt),range?.startDate?gte(s.expenses.expenseDate,range.startDate):undefined,range?lte(s.expenses.expenseDate,range.endDate):undefined)).orderBy(desc(s.expenses.expenseDate))).map(({expense,responsible})=>({...expense,responsibleName:responsible??"Sin responsable"}));
 const sum=(predicate:(f:Record<string,unknown>)=>boolean)=>items.filter(predicate).reduce((n,f)=>n.plus(String(f.amount)),new D(0));
 const total=sum(()=>true),fixed=sum(f=>f.classification==="opex"&&f.costBehavior==="fixed"),variable=sum(f=>f.classification==="opex"&&f.costBehavior==="variable"),purchases=sum(f=>f.classification==="material_purchase");
 const days=range?.startDate?Math.round((new Date(range.endDate+"T12:00:00Z").getTime()-new Date(range.startDate+"T12:00:00Z").getTime())/86400000)+1:null;
 metrics={periodCount:items.length,totalExpenses:total.toFixed(0),fixedExpenses:fixed.toFixed(0),variableExpenses:variable.toFixed(0),materialPurchases:purchases.toFixed(0),dailyAverage:days?quantize(total.div(days)):null,periodDays:days,categories:[...new Set(items.map(f=>String(f.category)))].sort((a,b)=>a.localeCompare(b,"es"))};
 }
 else if(entity==="losses")items=await db.select().from(s.independentLosses).where(and(eq(s.independentLosses.orgId,org),isNull(s.independentLosses.voidedAt)));
 else if(entity==="users")items=await listUsers();
 else if(entity==="settings"){const [row]=await db.select({settings:s.businessSettings,updatedByName:s.user.name}).from(s.businessSettings).leftJoin(s.user,eq(s.businessSettings.updatedBy,s.user.id)).where(eq(s.businessSettings.organizationId,org));items=row?[{...row.settings,id:org,updatedByName:row.updatedByName}]:[];}
 else throw new AccessError("VALIDATION_ERROR","Listado desconocido.");
 if(entity==="quotes"){const today=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Bogota",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());const priced=items.filter(i=>i.selectedPrice!==null&&i.selectedPrice!==undefined);metrics={active:items.filter(i=>["draft","sent"].includes(String(i.status))).length,sent:items.filter(i=>i.status==="sent").length,accepted:items.filter(i=>i.status==="accepted").length,total:items.length,monthTotal:priced.filter(i=>String(i.businessDate).startsWith(today.slice(0,7))).reduce((sum,i)=>sum.plus(String(i.selectedPrice)),new D(0)).toFixed(0),average:priced.length?priced.reduce((sum,i)=>sum.plus(String(i.selectedPrice)),new D(0)).div(priced.length).toFixed(0):null};}
 const [settings]=await db.select().from(s.businessSettings).where(eq(s.businessSettings.organizationId,org));
 if(settings)defaults={...settings,formula:{powerKw:settings.powerKw,energyRate:settings.energyKwhRate,machineRate:settings.machineHourRate,contingencyRate:settings.contingencyRate,multipliers:[settings.minimumMultiplier,settings.mediumMultiplier,settings.highMultiplier]}};
 if(q)items=items.filter(i=>[i.name,i.code,i.projectName,i.title,i.description,i.brand,i.email,i.customer,...(entity==="expenses"?[i.category,i.responsibleName,i.notes]:[]),...(entity==="filaments"?[i.model,i.materialType,i.color]:[]),...(entity==="customers"?[i.contactPhone,i.socialHandle]:[])].some(v=>String(v??"").toLocaleLowerCase("es").includes(q.toLocaleLowerCase("es"))));
 if(filter&&entity==="quotes")items=items.filter(i=>i.status===filter);
 if(filter&&entity==="expenses")items=items.filter(i=>i.category===filter);
 if(filter&&entity==="filaments")items=items.filter(i=>String(i.materialType).trim().toUpperCase()===filter.trim().toUpperCase());
 const sort=z.enum(["date","name","amount","date_desc","name_asc","amount_desc","orders","unit_asc","unit_desc","weight_desc","amount_asc"]).parse(options.sort??"date");
 const dateKey=(item:Record<string,unknown>)=>{const value=(entity==="expenses"?item.expenseDate:item.createdAt)??item.orderDate??item.expenseDate??"";return value instanceof Date?value.toISOString():String(value);};
 items.sort((a,b)=>{let result=0;if(entity==="filaments"&&sort.startsWith("unit_"))result=new D(String(a.pricePerGram)).cmp(String(b.pricePerGram))*(sort==="unit_desc"?-1:1);else if(entity==="filaments"&&sort==="weight_desc")result=new D(String(b.rollWeightG)).cmp(String(a.rollWeightG));else if(sort==="orders"&&entity==="customers")result=Number(b.orderCount)-Number(a.orderCount);else if(sort.startsWith("name"))result=String(a.name??a.projectName??a.title??a.brand??a.code??"").localeCompare(String(b.name??b.projectName??b.title??b.brand??b.code??""),"es");else if(sort.startsWith("amount"))result=new D(String(b.amount??b.agreedPrice??b.selectedPrice??b.purchaseValue??0)).cmp(String(a.amount??a.agreedPrice??a.selectedPrice??a.purchaseValue??0))*(sort==="amount_asc"?-1:1);else result=dateKey(b).localeCompare(dateKey(a));return result||String(a.id).localeCompare(String(b.id));});
 const total=items.length;
 const limit=z.number().int().min(1).max(100).parse(options.limit??25),pages=Math.max(1,Math.ceil(total/limit)),page=Math.min(z.number().int().positive().parse(options.page??1),pages);
 const pageItems=items.slice((page-1)*limit,page*limit);
 if(entity==="quotes"&&pageItems.length){
 const revisionIds=pageItems.map(i=>i.revisionId).filter((id):id is string=>typeof id==="string");
 const materials=revisionIds.length?await db.select({revisionId:s.quoteMaterials.revisionId,grams:s.quoteMaterials.grams,filamentSnapshot:s.quoteMaterials.filamentSnapshot}).from(s.quoteMaterials).where(and(eq(s.quoteMaterials.orgId,org),inArray(s.quoteMaterials.revisionId,revisionIds))).orderBy(asc(s.quoteMaterials.id)):[];
 for(const item of pageItems)item.cardMaterials=materials.filter(m=>m.revisionId===item.revisionId);
 }
 return serialize({items:pageItems,total,page,pages,metrics,access:ctx,defaults});
}
export async function getEntityDetail(entity:string,id:string){
 z.string().uuid().parse(id);const ctx=await requireAccess(adminEntities.has(entity)?"administrator":undefined),db=getDb(),org=ctx.organizationId;
 let item:Record<string,unknown>|undefined;const related:Record<string,Record<string,unknown>[]>= {};
 if(entity==="customers"){[item]=await db.select().from(s.customers).where(and(eq(s.customers.orgId,org),eq(s.customers.id,id)));related.orders=await db.select().from(s.orders).where(and(eq(s.orders.orgId,org),eq(s.orders.customerId,id),isNull(s.orders.archivedAt))).orderBy(desc(s.orders.orderDate));related.quotes=await db.select().from(s.quotes).where(and(eq(s.quotes.orgId,org),eq(s.quotes.customerId,id)));if(item){item.orderCount=related.orders.length;item.lastOrder=related.orders[0]?.orderDate??null;}}
 else if(entity==="filaments"){[item]=await db.select().from(s.filaments).where(and(eq(s.filaments.orgId,org),eq(s.filaments.id,id)));if(item)item.pricePerGram=quantize(new D(String(item.purchaseValue)).div(String(item.rollWeightG)));}
 else if(entity==="quotes"){const [row]=await db.select({q:s.quotes,r:s.quoteRevisions}).from(s.quotes).leftJoin(s.quoteRevisions,eq(s.quotes.currentRevisionId,s.quoteRevisions.id)).where(and(eq(s.quotes.orgId,org),eq(s.quotes.id,id)));if(row)item={...row.q,...row.r,id:row.q.id,quoteId:row.q.id,revisionId:row.r?.id,version:row.q.version,selectedPrice:row.r?.quotedPrice};related.revisions=await db.select().from(s.quoteRevisions).where(and(eq(s.quoteRevisions.orgId,org),eq(s.quoteRevisions.quoteId,id))).orderBy(desc(s.quoteRevisions.revisionNumber));if(item){related.materials=await db.select().from(s.quoteMaterials).where(and(eq(s.quoteMaterials.orgId,org),eq(s.quoteMaterials.revisionId,String(item.revisionId))));related.postprocess=await db.select().from(s.quotePostprocesses).where(and(eq(s.quotePostprocesses.orgId,org),eq(s.quotePostprocesses.revisionId,String(item.revisionId))));related.priceOptions=await db.select().from(s.quotePriceOptions).where(and(eq(s.quotePriceOptions.orgId,org),eq(s.quotePriceOptions.revisionId,String(item.revisionId))));}}
 else if(entity==="orders"){[item]=await db.select().from(s.orders).where(and(eq(s.orders.orgId,org),eq(s.orders.id,id),isNull(s.orders.archivedAt)));related.attempts=await db.select().from(s.productionAttempts).where(and(eq(s.productionAttempts.orgId,org),eq(s.productionAttempts.orderId,id))).orderBy(desc(s.productionAttempts.attemptNumber));related.costs=await db.select().from(s.directCosts).where(and(eq(s.directCosts.orgId,org),eq(s.directCosts.orderId,id),isNull(s.directCosts.voidedAt)));const pays=await db.select().from(s.payments).where(and(eq(s.payments.orgId,org),eq(s.payments.orderId,id),isNull(s.payments.voidedAt)));if(item){const received=pays.reduce((n,p)=>n.plus(p.amount),new D(0));item.receivedAmount=received.toFixed(0);item.balance=item.agreedPrice===null?null:new D(String(item.agreedPrice)).minus(received).toFixed(0);item.paymentStatus=item.balance==="0"?"paid":"pending";item.actualCost=null;}if(item){
 if(item.acceptedRevisionId){const [revision]=await db.select().from(s.quoteRevisions).where(and(eq(s.quoteRevisions.orgId,org),eq(s.quoteRevisions.id,String(item.acceptedRevisionId))));if(revision){related.linkedRevision=[revision];related.materials=await db.select().from(s.quoteMaterials).where(and(eq(s.quoteMaterials.orgId,org),eq(s.quoteMaterials.revisionId,revision.id)));item.estimatedCost=item.estimatedCostOverride??revision.estimatedCost;item.actualCost=item.estimatedCost;item.originalQuotedPrice=revision.quotedPrice;item.originalEstimatedCost=revision.estimatedCost;}}
 const [customer]=await db.select({name:s.customers.name,contactPhone:s.customers.contactPhone}).from(s.customers).where(and(eq(s.customers.orgId,org),eq(s.customers.id,String(item.customerId))));item.customerName=customer?.name;item.customerPhone=customer?.contactPhone;
 if(!item.confirmedAt){const candidates=await db.select({q:s.quotes,r:s.quoteRevisions}).from(s.quotes).innerJoin(s.quoteRevisions,eq(s.quotes.currentRevisionId,s.quoteRevisions.id)).where(and(eq(s.quotes.orgId,org),eq(s.quotes.customerId,String(item.customerId)),isNull(s.quotes.archivedAt)));
 const linked=await db.select({quoteId:s.orders.sourceQuoteId}).from(s.orders).where(eq(s.orders.orgId,org));const used=new Set(linked.map(o=>o.quoteId));related.availableQuotes=candidates.filter(({q})=>!used.has(q.id)).map(({q,r})=>({id:q.id,code:q.code,version:q.version,revisionId:r.id,status:r.status,projectName:r.projectName,estimatedCost:r.estimatedCost,quotedPrice:r.quotedPrice}));}
}if(ctx.role==="administrator")related.payments=pays;}
 else if(entity==="users"){
 [item]=await db.select({id:s.user.id,membershipId:s.memberships.id,name:s.user.name,email:s.user.email,role:s.memberships.role,active:s.memberships.active,version:s.memberships.version,createdAt:s.memberships.createdAt,updatedAt:s.memberships.updatedAt}).from(s.memberships).innerJoin(s.user,eq(s.memberships.userId,s.user.id)).where(and(eq(s.memberships.organizationId,org),eq(s.memberships.userId,id)));
 if(item){const [admins]=await db.select({total:count()}).from(s.memberships).where(and(eq(s.memberships.organizationId,org),eq(s.memberships.role,"administrator"),eq(s.memberships.active,true)));item.lastAdministrator=item.role==="administrator"&&item.active&&admins.total===1;
 related.audit=(await db.select({event:s.auditEvents,actor:s.user.name}).from(s.auditEvents).leftJoin(s.user,eq(s.auditEvents.actorId,s.user.id)).where(and(eq(s.auditEvents.orgId,org),eq(s.auditEvents.entityType,"membership"),eq(s.auditEvents.entityId,String(item.membershipId)))).orderBy(desc(s.auditEvents.occurredAt)).limit(20)).map(({event,actor})=>({...event,actorName:actor??"Usuario del taller"}));}
 }
 else if(entity==="expenses"){
 const [row]=await db.select({expense:s.expenses,responsible:s.user.name}).from(s.expenses).leftJoin(s.user,eq(s.expenses.responsibleUserId,s.user.id)).where(and(eq(s.expenses.orgId,org),eq(s.expenses.id,id)));
 if(row){item={...row.expense,responsibleName:row.responsible??"Sin responsable"};
 related.audit=(await db.select({event:s.auditEvents,actor:s.user.name}).from(s.auditEvents).leftJoin(s.user,eq(s.auditEvents.actorId,s.user.id)).where(and(eq(s.auditEvents.orgId,org),eq(s.auditEvents.entityType,"expense"),eq(s.auditEvents.entityId,id))).orderBy(desc(s.auditEvents.occurredAt)).limit(30)).map(({event,actor})=>({...event,actorName:actor??"Usuario del taller"}));
 related.corrections=await db.select({id:s.expenses.id,description:s.expenses.description}).from(s.expenses).where(and(eq(s.expenses.orgId,org),eq(s.expenses.correctionOfId,id)));
 }
 }
 if(entity==="orders"&&ctx.role==="administrator"){const ids=related.costs?.map(c=>String(c.id))??[];related.cashMovements=(await db.select().from(s.cashMovements).where(and(eq(s.cashMovements.orgId,org),isNull(s.cashMovements.voidedAt)))).filter(m=>!!m.directCostId&&ids.includes(m.directCostId));}
 if(!item)throw new AccessError("NOT_FOUND","Registro no encontrado.");
 return serialize({item,related,access:ctx});
}
