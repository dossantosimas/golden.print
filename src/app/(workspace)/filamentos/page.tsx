import {FilamentsList} from "@/components/filaments-list";
export default async function Page({searchParams}:{searchParams:Promise<{q?:string;filter?:string;page?:string;sort?:string;view?:string}>}){
 const params=await searchParams;
 return <FilamentsList q={params.q} filter={params.filter} page={params.page} sort={params.sort} view={params.view}/>;
}
