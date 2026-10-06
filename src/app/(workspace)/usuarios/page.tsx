import {UsersPage} from "@/components/users-page";
export default async function Page({searchParams}:{searchParams:Promise<{q?:string;filter?:string}>}){const p=await searchParams;return <UsersPage q={p.q} filter={p.filter}/>;}
