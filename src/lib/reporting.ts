import "server-only";
import {getPool} from "./db";
import {D,quantize} from "./finance";
import {periodRange,todayBogota} from "./dates";
import type {AccessContext} from "./access";
import {serialize} from "./serialization";
export async function reportingData(ctx:AccessContext,filter="",includeRecords=true){
 let start:string|undefined,end:string|undefined;if(filter.includes(":"))[start,end]=filter.split(":");
 const range=periodRange(start||undefined,end||undefined),pool=getPool();
 const values=[ctx.organizationId,range.startDate??null,range.endDate,range.start?.toISOString()??null,range.end.toISOString()];
 const operational=await pool.query(`SELECT status,count(*)::int n FROM "order" WHERE org_id=$1 AND ($2::date IS NULL OR order_date >= $2::date) AND order_date <= $3::date GROUP BY status`,values.slice(0,3));
 const counts:Record<string,number>=Object.fromEntries(["not_started","printing","finished","delivered","closed","damaged"].map(k=>[k,0]));for(const row of operational.rows)counts[row.status]=row.n;
 const total=Object.values(counts).reduce((a,b)=>a+b,0);
 if(ctx.role!=="administrator")return {items:[],total,metrics:{totalOrders:total,...counts},access:ctx,basis:"order_date_current_status"};
 // PostgreSQL NUMERIC aggregates preserve exact amounts without loading every financial row.
 const cte=`WITH os AS (SELECT * FROM "order" WHERE org_id=$1),
 cohort AS (SELECT o.*,COALESCE(o.estimated_cost_override,r.estimated_cost,0) product_cost,
 CASE WHEN r.estimated_cost > 0 THEN COALESCE(o.estimated_cost_override,r.estimated_cost)*(r.material_cost+r.energy_cost+r.postprocess_cost)/r.estimated_cost
 ELSE COALESCE(o.estimated_cost_override,0) END variable_product_cost
 FROM os o LEFT JOIN quote_revision r ON r.id=o.accepted_revision_id AND r.org_id=o.org_id
 WHERE o.delivered_at < $5::timestamptz AND ($4::timestamptz IS NULL OR o.delivered_at >= $4::timestamptz)),
 confirmed AS (SELECT * FROM os WHERE confirmed_at <= $5::timestamptz),
 costs AS (SELECT * FROM direct_cost WHERE org_id=$1 AND voided_at IS NULL AND incurred_date <= $3::date),
 pays AS (SELECT * FROM payment WHERE org_id=$1 AND voided_at IS NULL AND payment_date <= $3::date),
 paid AS (SELECT order_id,sum(amount) amount FROM pays GROUP BY order_id),
 operating AS (SELECT * FROM expense WHERE org_id=$1 AND voided_at IS NULL AND classification='opex' AND expense_date <= $3::date AND ($2::date IS NULL OR expense_date >= $2::date)),
 loss AS (SELECT * FROM independent_loss WHERE org_id=$1 AND voided_at IS NULL AND recognized_date <= $3::date AND ($2::date IS NULL OR recognized_date >= $2::date)),
 cash AS (SELECT * FROM cash_movement WHERE org_id=$1 AND voided_at IS NULL AND business_date <= $3::date AND ($2::date IS NULL OR business_date >= $2::date)) `;
 const aggregate=`SELECT
 COALESCE((SELECT sum(agreed_price) FROM cohort),0)::text sales,
 COALESCE((SELECT sum(product_cost) FROM cohort),0)::text direct,
 COALESCE((SELECT sum(variable_product_cost) FROM cohort),0)::text variable_direct,
 COALESCE((SELECT sum(amount) FROM operating),0)::text opex,
 COALESCE((SELECT sum(amount) FROM operating WHERE cost_behavior='fixed'),0)::text fixed,
 COALESCE((SELECT sum(amount) FROM operating WHERE cost_behavior='variable'),0)::text variable_opex,
 COALESCE((SELECT sum(amount) FROM loss),0)::text losses,
 COALESCE((SELECT sum(amount) FROM pays WHERE $2::date IS NULL OR payment_date >= $2::date),0)::text receipts,
 COALESCE((SELECT sum(p.amount) FROM pays p JOIN cohort o ON o.id=p.order_id),0)::text cohort_receipts,
 COALESCE((SELECT sum(COALESCE(o.agreed_price,0)-COALESCE(p.amount,0)) FROM confirmed o LEFT JOIN paid p ON p.order_id=o.id),0)::text balance,
 COALESCE((SELECT sum(c.amount) FROM costs c JOIN production_attempt a ON a.id=c.attempt_id AND a.org_id=$1 WHERE a.status='failed' AND ($2::date IS NULL OR c.incurred_date >= $2::date)),0)::text failed_cost,
 COALESCE((SELECT sum(amount) FROM cash WHERE direction='in'),0)::text cash_in,
 COALESCE((SELECT sum(amount) FROM cash WHERE direction='out'),0)::text cash_out,
 false provisional`;
 const [aggregates,ranking,cash]=await Promise.all([
 pool.query(cte+aggregate,values),
 pool.query(cte+` ,customer_orders AS (SELECT o.customer_id,count(*)::int n,sum(COALESCE(o.agreed_price,0)-COALESCE(p.amount,0)) balance,max(o.order_date)::text last_order FROM confirmed o LEFT JOIN paid p ON p.order_id=o.id GROUP BY o.customer_id), customer_sales AS (SELECT customer_id,sum(agreed_price) sales FROM cohort GROUP BY customer_id) SELECT c.id,c.name,COALESCE(o.n,0) "orderCount",COALESCE(s.sales,0)::text "totalSales",COALESCE(o.balance,0)::text balance,o.last_order "lastOrder" FROM customer c LEFT JOIN customer_orders o ON o.customer_id=c.id LEFT JOIN customer_sales s ON s.customer_id=c.id WHERE c.org_id=$1 ORDER BY COALESCE(s.sales,0) DESC,c.id`,values),
 includeRecords?pool.query(`SELECT id,business_date::text "businessDate",direction,amount::text amount,reference,direct_cost_id "directCostId",independent_loss_id "independentLossId",version FROM cash_movement WHERE org_id=$1 AND voided_at IS NULL AND business_date <= $3::date AND ($2::date IS NULL OR business_date >= $2::date) ORDER BY business_date DESC,id`,values.slice(0,3)):Promise.resolve({rows:[]})]);
 const a=aggregates.rows[0],sales=new D(a.sales),direct=new D(a.direct),variableDirect=new D(a.variable_direct),opex=new D(a.opex),loss=new D(a.losses),cashIn=new D(a.cash_in),cashOut=new D(a.cash_out),gross=sales.minus(direct),net=gross.minus(opex).minus(loss);
 const contribution=sales.minus(variableDirect).minus(a.variable_opex).minus(loss),rate=sales.isZero()?null:contribution.div(sales);
 const breakEven=a.provisional||!rate||rate.lte(0)?null:new D(a.fixed).plus(direct.minus(variableDirect)).div(rate);
 const ratio=(n:InstanceType<typeof D>,den:InstanceType<typeof D>)=>den.isZero()?null:quantize(n.div(den).times(100));
 return serialize({items:ranking.rows.map(r=>({...r,totalSales:quantize(new D(r.totalSales)),balance:quantize(new D(r.balance))})),total,access:ctx,metrics:{totalOrders:total,...counts,sales:quantize(sales),directCosts:quantize(direct),grossProfit:quantize(gross),grossMargin:ratio(gross,sales),receipts:quantize(new D(a.receipts)),cohortReceipts:quantize(new D(a.cohort_receipts)),collectionRate:ratio(new D(a.cohort_receipts),sales),receivables:quantize(new D(a.balance)),opex:quantize(opex),independentLosses:quantize(loss),failedCosts:quantize(new D(a.failed_cost)),netProfit:quantize(net),cashIn:quantize(cashIn),cashOut:quantize(cashOut),cashNet:quantize(cashIn.minus(cashOut)),breakEven:breakEven?quantize(breakEven):null,breakEvenProgress:breakEven&&!breakEven.isZero()?ratio(sales,breakEven):null,provisional:a.provisional},cashMovements:cash.rows,period:{start:range.startDate??null,end:range.endDate},basis:"delivered_cohort_and_effective_cash_dates",temporalMode:"current_restated",asOf:todayBogota()});
}
