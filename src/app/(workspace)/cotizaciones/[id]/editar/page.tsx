import {getCustomerOptions,getFilamentOptions,getEntityDetail} from "@/lib/app-service";
import {QuoteForm} from "@/components/quote-form";
import type {QuoteInput} from "@/lib/finance";
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;const [customers,filaments,quote]=await Promise.all([getCustomerOptions(),getFilamentOptions(),getEntityDetail("quotes",id)]);const snapshot=quote.item.formulaSnapshot as {inputSnapshot:QuoteInput};return <div className="flex flex-col gap-6"><QuoteForm customers={customers} filaments={filaments} initial={snapshot.inputSnapshot} quoteId={id} revisionId={String(quote.item.revisionId)} version={quote.item.version} status={String(quote.item.status)}/></div>;}
