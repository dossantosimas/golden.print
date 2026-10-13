import {CustomerDetail} from '@/components/customer-detail';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <CustomerDetail id={id}/>;}
