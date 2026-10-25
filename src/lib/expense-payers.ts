import {D} from "./finance";
export type ExpensePayerTotal={id:string;name:string;count:number;total:string;operating:string;materials:string};
export function summarizeExpensePayers(items:Record<string,unknown>[]){
 const totals=new Map<string,ExpensePayerTotal>();
 for(const item of items){
  if(item.voidedAt)continue;
  const company=item.fundingSource!=="user",id=company?"company":`user:${item.responsibleUserId}`;
  const row=totals.get(id)??{id,name:company?"Empresa":String(item.responsibleName??"Usuario"),count:0,total:"0",operating:"0",materials:"0"};
  row.count++;row.total=new D(row.total).plus(String(item.amount)).toFixed(0);
  if(item.classification==="opex")row.operating=new D(row.operating).plus(String(item.amount)).toFixed(0);
  if(item.classification==="material_purchase")row.materials=new D(row.materials).plus(String(item.amount)).toFixed(0);
  totals.set(id,row);
 }
 return [...totals.values()];
}
export function includeExpensePayers(rows:ExpensePayerTotal[],users:{id:string;name:string}[]){
 const all=new Map(rows.map(row=>[row.id,{...row}]));
 for(const user of [{id:"company",name:"Empresa"},...users.map(user=>({...user,id:`user:${user.id}`}))]){const existing=all.get(user.id);all.set(user.id,existing?{...existing,name:user.name}:{...user,count:0,total:"0",operating:"0",materials:"0"});}
 return [...all.values()].sort((a,b)=>a.id==="company"?-1:b.id==="company"?1:a.name.localeCompare(b.name,"es"));
}
