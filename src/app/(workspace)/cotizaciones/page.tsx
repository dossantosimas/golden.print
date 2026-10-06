import {QuotesList} from "@/components/quotes-list";
export default async function Page({searchParams}:{searchParams:Promise<{q?:string;filter?:string;page?:string;sort?:string;view?:string}>}){return <QuotesList {...await searchParams}/>;}
