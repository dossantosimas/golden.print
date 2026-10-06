import {FinancePage} from "@/components/finance-page";
export default async function Page({searchParams}:{searchParams:Promise<{start?:string;end?:string}>}){const p=await searchParams;return <FinancePage start={p.start} end={p.end}/>;}
