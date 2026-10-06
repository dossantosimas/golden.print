import {getCustomerOptions,getWorkspaceData} from "@/lib/app-service";
import {QuoteForm} from "@/components/quote-form";
export default async function Page(){const [customers,filaments]=await Promise.all([getCustomerOptions(),getWorkspaceData("filaments")]);return <div className="flex flex-col gap-6"><QuoteForm customers={customers} filaments={filaments.items} defaults={filaments.defaults?.formula as Record<string,unknown>|undefined}/></div>;}
