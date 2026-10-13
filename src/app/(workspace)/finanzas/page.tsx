import {FinancePage} from "@/components/finance-page";
export default async function Page({searchParams}:{searchParams:Promise<{start?:string;end?:string;view?:string;monthA?:string;monthB?:string}>}){const p=await searchParams;return <FinancePage start={p.start} end={p.end} view={p.view} monthA={p.monthA} monthB={p.monthB}/>;}
