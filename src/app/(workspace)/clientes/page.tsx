import {CustomersList} from "@/components/customers-list";
export default async function Page({searchParams}:{searchParams:Promise<{q?:string;page?:string;sort?:string;view?:string}>}){
 const params=await searchParams;
 return <CustomersList q={params.q} page={params.page} sort={params.sort} view={params.view}/>;
}
