import Link from "next/link";
import {metricSignal} from "@/lib/metric-signal";
import {ArrowUpRight, Banknote, Boxes, CircleCheck, ClipboardList, FilePlus2, PackagePlus, Printer, Users, Wallet, type LucideIcon} from "lucide-react";
import {FinancialRecords} from "@/components/financial-records";
import {PeriodPresets} from "@/components/period-presets";
import {FinanceChart} from "@/components/finance-chart";
import {getWorkspaceData} from "@/lib/app-service";
import {money, display, percentage, statusLabels} from "@/components/display";
import {CommandForm} from "@/components/command-form";
import {Card, CardHeader, CardTitle, CardContent, CardDescription} from "@/components/ui/card";
import {Alert, AlertTitle, AlertDescription} from "@/components/ui/alert";
import {Table, TableHeader, TableRow, TableHead, TableBody, TableCell} from "@/components/ui/table";
import {Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent, EmptyMedia} from "@/components/ui/empty";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Field, FieldGroup, FieldLabel} from "@/components/ui/field";

const metricLabels: Record<string, string> = {
 sales:"Ventas de pedidos entregados", directCosts:"Costo de productos entregados", grossProfit:"Utilidad bruta", grossMargin:"Margen bruto (%)", receipts:"Recaudo del período", cohortReceipts:"Recaudo de pedidos entregados", collectionRate:"Cobro de entregas (%)", receivables:"Cartera global", opex:"Gastos operativos", independentLosses:"Pérdidas independientes", failedCosts:"Costos de intentos fallidos", netProfit:"Utilidad neta operativa", cashIn:"Entradas de caja", cashOut:"Salidas de caja", cashNet:"Caja neta", breakEven:"Punto de equilibrio", breakEvenProgress:"Avance del equilibrio (%)", not_started:"Sin empezar", printing:"Imprimiendo", finished:"Terminados", delivered:"Entregados", closed:"Cerrados", damaged:"Dañados", totalOrders:"Pedidos",
};
const countKeys = ["totalOrders", "not_started", "printing", "finished", "delivered", "closed", "damaged"];
function metricValue(key: string, value: unknown) {
 if (value === null || value === undefined) return "Sin base";
 if (/Margin|Rate|Progress/.test(key)) return percentage(value);
 return countKeys.includes(key) ? display(value) : money(value);
}
function Kpi({metric, metrics, icon: Icon, context}: {metric: string; metrics: Record<string, unknown>; icon: LucideIcon; context: string}) {
 const signal=metricSignal(metric,metrics[metric]);
 return <Card className="report-kpi" data-tone={signal.tone}><CardHeader><div className="flex items-center justify-between gap-3"><CardTitle>{metricLabels[metric]}</CardTitle><Icon className="report-kpi-icon" aria-hidden="true"/></div></CardHeader><CardContent><div className="report-kpi-reading"><p className="report-kpi-value">{metricValue(metric, metrics[metric])}</p><span className="metric-signal">{signal.label}</span></div><p className="report-kpi-context">{context}</p></CardContent></Card>;
}
function MetricGroup({title, description, keys, metrics}: {title: string; description: string; keys: string[]; metrics: Record<string, unknown>}) {
 return <Card><CardHeader><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader><CardContent><dl className="report-metric-list">{keys.map(key => <div key={key}><dt>{metricLabels[key]}</dt><dd data-tone={metricSignal(key,metrics[key]).tone}>{metricValue(key, metrics[key])}</dd></div>)}</dl></CardContent></Card>;
}
export function PeriodToolbar({start, end, newOrder=false}: {start: string; end: string; newOrder?: boolean}) {
 return <section className="report-period-toolbar" aria-label="Filtrar por período"><div className="flex min-w-0 flex-col gap-2">{newOrder&&<div className="report-period-title"><Button render={<Link href="/pedidos/nuevo"/>} nativeButton={false}><PackagePlus data-icon="inline-start"/>Nuevo pedido</Button></div>}<PeriodPresets/></div><form className="report-range-form"><FieldGroup className="report-range-fields"><Field className="w-36"><FieldLabel htmlFor="report-start">Desde</FieldLabel><Input key={start} id="report-start" name="start" type="date" defaultValue={start} required/></Field><Field className="w-36"><FieldLabel htmlFor="report-end">Hasta</FieldLabel><Input key={end} id="report-end" name="end" type="date" defaultValue={end} required/></Field></FieldGroup><Button type="submit" variant="outline">Aplicar período</Button></form></section>;
}
function StatusBand({metrics}: {metrics: Record<string, unknown>}) {
 return <section className="report-status-band" aria-label="Estado de los pedidos">{["not_started", "printing", "finished", "delivered", "closed", "damaged"].map(key => <Link href={"/pedidos?filter=" + key} className="report-status-item" data-tone={metricSignal(key,metrics[key]).tone} key={key}><span className="status-caption">{metricLabels[key]}</span><div className="status-reading"><strong className="tabular-nums">{display(metrics[key] ?? 0)}</strong><small>{metricSignal(key,metrics[key]).label}</small></div></Link>)}</section>;
}
function QuickActions({admin}: {admin: boolean}) {
 const actions = [{href:"/cotizaciones/nueva", label:"Crear cotización", detail:"Material, tiempo y acabados", icon:FilePlus2}, {href:"/pedidos/nuevo", label:"Nuevo pedido", detail:"Registrar un proyecto", icon:PackagePlus}, {href:"/clientes", label:"Clientes", detail:"Contactos e historial", icon:Users}, ...(admin ? [{href:"/finanzas", label:"Revisar finanzas", detail:"Resultados, cartera y caja", icon:Wallet}] : [])];
 return <Card><CardHeader><CardTitle>Acciones del taller</CardTitle></CardHeader><CardContent className="flex flex-col">{actions.map(({href,label,detail,icon:Icon}) => <Link className="report-quick-link" href={href} key={href}><span className="report-quick-icon"><Icon className="size-5" aria-hidden="true"/></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{label}</span><span className="block text-xs text-muted-foreground">{detail}</span></span><ArrowUpRight className="size-4" aria-hidden="true"/></Link>)}</CardContent></Card>;
}

export async function ReportPage({finance=false, start="", end=""}: {finance?: boolean; start?: string; end?: string}) {
 let data;
 try {data = await getWorkspaceData(finance ? "finance" : "dashboard", "", start && end ? start + ":" + end : "");}
 catch {return <Alert variant="destructive"><AlertTitle>No pudimos cargar el reporte</AlertTitle><AlertDescription>Intenta de nuevo o solicita ayuda al administrador.</AlertDescription></Alert>;}
 const metrics = data.metrics ?? {};
 const admin = data.access.role === "administrator";
 const operational = finance ? data.items : (await getWorkspaceData("orders", "", "", {sort:"date_desc"})).items.filter(item => (!start || String(item.orderDate) >= start) && (!end || String(item.orderDate) <= end)).slice(0, 8);
 return <div className="flex flex-col gap-6">
  {finance&&<div className="page-heading"><div><p className="eyebrow">Control financiero</p><h1>Finanzas</h1><p className="mt-2 text-sm text-muted-foreground">Resultados del período, cartera y movimientos de caja.</p></div></div>}
  <PeriodToolbar start={start} end={end} newOrder={!finance}/>
  {!!metrics.provisional && <Alert><AlertTitle>Resultado provisional</AlertTitle><AlertDescription>Hay pedidos entregados con costos reales incompletos. Completa sus costos para confirmar la utilidad.</AlertDescription></Alert>}
  <div className="report-kpi-grid">{finance ? <><Kpi metric="sales" metrics={metrics} icon={Banknote} context="Pedidos entregados en el período"/><Kpi metric="netProfit" metrics={metrics} icon={Wallet} context="Después de costos, gastos y pérdidas"/><Kpi metric="receivables" metrics={metrics} icon={ClipboardList} context="Saldo de todos los pedidos confirmados"/><Kpi metric="cashNet" metrics={metrics} icon={Banknote} context="Entradas menos salidas del período"/></> : <><Kpi metric="totalOrders" metrics={metrics} icon={Boxes} context="Por fecha del pedido"/><Kpi metric="printing" metrics={metrics} icon={Printer} context="Producción en curso"/><Kpi metric="finished" metrics={metrics} icon={CircleCheck} context="Pendientes de entrega"/><Kpi metric={admin ? "receivables" : "delivered"} metrics={metrics} icon={admin ? Wallet : PackagePlus} context={admin ? "Saldo de todos los pedidos confirmados" : "Entregados en el período"}/></>}</div>
  {!finance && <StatusBand metrics={metrics}/>}
  {finance ? <>
   <div className="grid items-start gap-6 xl:grid-cols-3"><MetricGroup title="Rentabilidad" description="Pedidos entregados en el período." keys={["sales", "directCosts", "grossProfit", "grossMargin", "opex", "independentLosses", "netProfit"]} metrics={metrics}/><MetricGroup title="Recaudo y caja" description="Pagos y desembolsos por su fecha real." keys={["receipts", "cohortReceipts", "collectionRate", "receivables", "cashIn", "cashOut", "cashNet"]} metrics={metrics}/><MetricGroup title="Equilibrio y producción" description="Costos fallidos y cobertura de costos fijos." keys={["failedCosts", "breakEven", "breakEvenProgress", "totalOrders", "not_started", "printing", "finished", "delivered", "closed", "damaged"]} metrics={metrics}/></div>
   <div className="grid items-start gap-6 xl:grid-cols-2"><Card><CardHeader><CardTitle>Ventas, costos y utilidad</CardTitle><CardDescription>Importes del período en pesos colombianos.</CardDescription></CardHeader><CardContent><FinanceChart metrics={metrics}/></CardContent></Card><Card><CardHeader><CardTitle>Clientes</CardTitle><CardDescription>Ventas entregadas del período y cartera al cierre.</CardDescription></CardHeader><CardContent>{operational.length ? <Table><TableHeader><TableRow><TableHead>Cliente</TableHead><TableHead className="text-right">Ventas</TableHead><TableHead className="text-right">Saldo</TableHead></TableRow></TableHeader><TableBody>{operational.map(item => <TableRow key={String(item.id ?? item.customerId)}><TableCell><Link className="inline-link" href={"/clientes/" + String(item.id ?? item.customerId)}>{display(item.name ?? item.customer)}</Link></TableCell><TableCell className="text-right tabular-nums">{money(item.totalSales ?? item.sales)}</TableCell><TableCell className="text-right tabular-nums">{money(item.balance ?? item.receivables)}</TableCell></TableRow>)}</TableBody></Table> : <Empty><EmptyHeader><EmptyMedia variant="icon"><Users/></EmptyMedia><EmptyTitle>Aún no hay clientes para comparar</EmptyTitle><EmptyDescription>Las ventas aparecerán al entregar los primeros pedidos.</EmptyDescription></EmptyHeader></Empty>}</CardContent></Card></div>
   <Card><CardHeader><CardTitle>Registrar pérdida independiente</CardTitle><CardDescription>Para pérdidas que no pertenecen a un pedido. No repitas costos ya registrados.</CardDescription></CardHeader><CardContent className="max-w-2xl"><CommandForm command="losses.create" fields={[{name:"recognizedDate", label:"Fecha", type:"date", required:true}, {name:"category", label:"Categoría", required:true}, {name:"description", label:"Descripción", required:true}, {name:"amount", label:"Valor (COP)", type:"number", min:"1", step:"1", required:true}, {name:"cashOutDate", label:"Fecha del desembolso (si se pagó)", type:"date"}, {name:"cashOutAmount", label:"Desembolso efectivo (COP, opcional)", type:"number", min:"1", step:"1", help:"Déjalo vacío si el costo ya se pagó como compra o gasto."}]} label="Registrar pérdida"/></CardContent></Card>
   <FinancialRecords cash={(data as unknown as {cashMovements?: Record<string, unknown>[]}).cashMovements ?? []}/>
  </> : <div className="report-main-grid"><Card><CardHeader><div className="flex items-center justify-between gap-3"><CardTitle>Pedidos recientes</CardTitle><Button variant="ghost" size="sm" render={<Link href="/pedidos"/>} nativeButton={false}>Ver pedidos<ArrowUpRight data-icon="inline-end"/></Button></div><CardDescription>Fecha del pedido y estado actual.</CardDescription></CardHeader><CardContent>{operational.length ? <Table><TableHeader><TableRow><TableHead>Pedido</TableHead><TableHead>Proyecto</TableHead><TableHead>Producción</TableHead></TableRow></TableHeader><TableBody>{operational.map(item => <TableRow key={String(item.id)}><TableCell><Link className="inline-link" href={"/pedidos/" + String(item.id)}>{display(item.code)}</Link></TableCell><TableCell>{display(item.title)}</TableCell><TableCell><Badge variant="secondary" data-status={String(item.status)}>{statusLabels[String(item.status)] ?? display(item.status)}</Badge></TableCell></TableRow>)}</TableBody></Table> : <Empty className="min-h-64"><EmptyHeader><EmptyMedia variant="icon"><Boxes/></EmptyMedia><EmptyTitle>Tu próximo proyecto empieza aquí</EmptyTitle><EmptyDescription>No hay pedidos recientes en este período.</EmptyDescription></EmptyHeader><EmptyContent><Button render={<Link href="/pedidos/nuevo"/>} nativeButton={false}><PackagePlus data-icon="inline-start"/>Crear primer pedido</Button></EmptyContent></Empty>}</CardContent></Card><QuickActions admin={admin}/></div>}
 </div>;
}
