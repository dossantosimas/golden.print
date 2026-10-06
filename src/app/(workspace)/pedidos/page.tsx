import {OrdersList} from "@/components/orders-list";
export default async function Page({searchParams}:{searchParams:Promise<{q?:string;filter?:string;page?:string;sort?:string;view?:string}>}){return <OrdersList {...await searchParams}/>;}
