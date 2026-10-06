"use client";
import {Button} from "@/components/ui/button";
import {Alert,AlertTitle,AlertDescription} from "@/components/ui/alert";
export default function ErrorPage({reset}:{error:Error;reset:()=>void}){return <main className="flex flex-col gap-4 p-8"><Alert variant="destructive"><AlertTitle>No pudimos cargar esta sección</AlertTitle><AlertDescription>Revisa tu conexión o solicita ayuda al administrador.</AlertDescription></Alert><Button onClick={reset}>Reintentar</Button></main>;}
