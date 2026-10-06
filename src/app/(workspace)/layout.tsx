import { redirect } from "next/navigation";
import { requireAccess, AccessError } from "@/lib/access";
import { WorkspaceShell } from "@/components/workspace-shell";
import { SessionGuard } from "@/components/session-guard";
export const dynamic = "force-dynamic";
export default async function WorkspaceLayout({children}:{children:React.ReactNode}) {
  let access;
  try{access=await requireAccess();}catch(error){if(error instanceof AccessError && error.code==="UNAUTHENTICATED")redirect("/login");throw error;}
  return <WorkspaceShell name={access.name} role={access.role}><SessionGuard/>{children}</WorkspaceShell>;
}
