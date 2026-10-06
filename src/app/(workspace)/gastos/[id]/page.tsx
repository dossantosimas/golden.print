import { ExpenseDetail } from '@/components/expense-detail';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <ExpenseDetail id={id}/>;}
