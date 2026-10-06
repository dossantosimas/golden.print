import {DashboardPage} from "@/components/dashboard-page";
export default async function Page({searchParams}:{searchParams:Promise<{start?:string;end?:string}>}){const p=await searchParams;return <DashboardPage start={p.start} end={p.end}/>;}
