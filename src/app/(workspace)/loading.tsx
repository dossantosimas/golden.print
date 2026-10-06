import {Skeleton} from "@/components/ui/skeleton";
export default function Loading(){return <div aria-busy="true" aria-label="Cargando sección" className="flex flex-col gap-6"><Skeleton className="h-8 w-48"/><Skeleton className="h-16 w-full"/><Skeleton className="h-64 w-full"/></div>;}
