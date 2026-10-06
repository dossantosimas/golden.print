"use client";
import Link from "next/link";
import {useState} from "react";
import {Plus} from "lucide-react";
import {PeriodPresets} from "@/components/period-presets";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
export function DashboardPeriod({start,end}:{start:string;end:string}){
 const [from,setFrom]=useState(start),[until,setUntil]=useState(end);
 return <section className="home-period" aria-label="Filtrar por período"><div className="home-period-main"><Button render={<Link href="/pedidos/nuevo"/>} nativeButton={false}><Plus/>Nuevo pedido</Button><PeriodPresets/></div><form className="home-period-form"><label htmlFor="home-start">Desde<Input id="home-start" name="start" type="date" value={from} onChange={e=>setFrom(e.target.value)} required/></label><label htmlFor="home-end">Hasta<Input id="home-end" name="end" type="date" value={until} onChange={e=>setUntil(e.target.value)} min={from||undefined} required/></label><Button type="submit" variant="outline">Aplicar período</Button></form></section>;
}
