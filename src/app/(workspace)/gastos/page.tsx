import {ExpensesList} from "@/components/expenses-list";
export default async function Page({searchParams}:{searchParams:Promise<{q?:string;filter?:string;page?:string;sort?:string;view?:string;start?:string;end?:string}>}){
 const params=await searchParams;
 return <ExpensesList {...params}/>;
}
