import {PageHeader} from "@/components/page-header";
import {PasswordForm} from "@/components/settings-form";
import {Card,CardHeader,CardTitle,CardContent,CardDescription} from "@/components/ui/card";
export default function Page(){return <div className="flex flex-col gap-6"><PageHeader title="Mi perfil" breadcrumbs={[{label:"Mi perfil"}]} description="Datos de acceso a tu cuenta."/><Card className="form-shell"><CardHeader><CardTitle>Mi contraseña</CardTitle><CardDescription>Elige una contraseña de al menos 12 caracteres.</CardDescription></CardHeader><CardContent><PasswordForm/></CardContent></Card></div>;}
