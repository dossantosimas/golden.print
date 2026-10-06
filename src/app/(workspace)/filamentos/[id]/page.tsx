import { FilamentDetail } from '@/components/filament-detail';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <FilamentDetail id={id}/>;}
