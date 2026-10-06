import {getFilamentOptions,getCustomerOptions,getWorkspaceData} from "@/lib/app-service";
import {QuoteForm} from "@/components/quote-form";
export default async function Page(){const [customers,filaments,options]=await Promise.all([getCustomerOptions(),getWorkspaceData("filaments"),getFilamentOptions()]);return <div className="flex flex-col gap-6"><QuoteForm customers={customers} filaments={options} defaults={filaments.defaults?.formula as Record<string,unknown>|undefined}/></div>;}
