import {PageHeader} from "@/components/page-header";
import Link from "next/link";
import { ClipboardList, Printer, Wallet, FileCheck2 } from "lucide-react";
import { getWorkspaceData } from "@/lib/app-service";
import { CommandForm } from "@/components/command-form";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default async function Page() {
 const data = await getWorkspaceData("customers");
 const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
 return <div className="flex flex-col gap-6">
  <PageHeader title="Nuevo pedido" breadcrumbs={[{label:"Pedidos",href:"/pedidos"},{label:"Nuevo"}]} description="Registra el proyecto y vincula su cotización." badges={<Badge variant="secondary">Ingreso provisional</Badge>}/><div className="new-order-grid">
   <Card className="form-shell"><CardHeader><CardTitle>Datos del proyecto</CardTitle><CardDescription>Los campos con * son obligatorios.</CardDescription></CardHeader><CardContent>
    {data.items.length === 0 && <Alert className="mb-6"><AlertTitle>Primero agrega un cliente</AlertTitle><AlertDescription><Link className="inline-link" href="/clientes">Crear cliente</Link> para asociarlo a este pedido.</AlertDescription></Alert>}
    <CommandForm command="orders.createIntake" fields={[{ name: "title", label: "Proyecto", required: true }, { name: "customerId", label: "Cliente", required: true, options: data.items.map(c => ({ value: String(c.id), label: String(c.name) })) }, { name: "orderDate", label: "Fecha del pedido", type: "date", value: today, required: true }, { name: "notes", label: "Notas", type: "textarea" }]} label="Crear pedido" redirectTo="/pedidos/:id" />
   </CardContent></Card>
   <aside className="workflow-guide"><div className="workflow-symbol" aria-hidden="true"><Printer /><span><ClipboardList /></span></div><p className="eyebrow">Del proyecto a la entrega</p><h2>Antes de iniciar la impresión</h2>
    <ol className="workflow-steps"><li><span className="workflow-step-icon"><FileCheck2 aria-hidden="true" /></span><div><h3>Confirma la cotización</h3><p>Vincula una propuesta aceptada para fijar el precio e iniciar la producción.</p></div></li><li><span className="workflow-step-icon"><Printer aria-hidden="true" /></span><div><h3>Registra la impresión</h3><p>Conserva los intentos y costos reales, incluidas las reimpresiones.</p></div></li><li><span className="workflow-step-icon"><Wallet aria-hidden="true" /></span><div><h3>Controla los pagos</h3><p>Registra cada anticipo o abono con su fecha y valor.</p></div></li></ol>
   </aside>
  </div>
 </div>;
}
