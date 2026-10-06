import Link from "next/link";
import {ChevronRight} from "lucide-react";
import type {ReactNode} from "react";

type Crumb = {label:string;href?:string};
export function PageHeader({title,breadcrumbs,description,badges,actions}:{title:ReactNode;breadcrumbs:Crumb[];description?:ReactNode;badges?:ReactNode;actions?:ReactNode}){
 return <header className="app-page-header">
  <nav aria-label="Ubicación de página"><ol><li><Link href="/dashboard">Mi taller</Link></li>{breadcrumbs.map((crumb,index)=><li key={index}><ChevronRight aria-hidden="true"/>{crumb.href?<Link href={crumb.href}>{crumb.label}</Link>:<span aria-current={index===breadcrumbs.length-1?"page":undefined}>{crumb.label}</span>}</li>)}</ol></nav>
  <div className="app-page-heading"><div className="app-page-title-group"><div className="app-page-title-row"><h1>{title}</h1>{badges&&<div className="app-page-badges">{badges}</div>}</div>{description&&<div className="app-page-description">{description}</div>}</div>{actions&&<div className="app-page-actions">{actions}</div>}</div>
 </header>;
}
