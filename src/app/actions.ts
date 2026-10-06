"use server";
import {randomUUID} from "node:crypto";
import {ZodError} from "zod";
import {executeCommand} from "@/lib/app-service";
import {AccessError} from "@/lib/access";
export async function action(command:string,input:Record<string,unknown>){
 const requestId=randomUUID();
 try {return {ok:true as const,data:await executeCommand(command,input),requestId};}
 catch(error){if(error instanceof ZodError)return {ok:false as const,error:{code:"VALIDATION_ERROR",message:"Revisa los campos del formulario.",fieldErrors:error.flatten().fieldErrors},requestId};
 if(error instanceof AccessError || error instanceof Error&&"code" in error&&typeof error.code==="string"&&!/^\d/.test(error.code))return {ok:false as const,error:{code:String(error.code),message:error.message},requestId};
 console.error("Command failed",requestId,command,error instanceof Error?error.name:"Error");
 return {ok:false as const,error:{code:"INTERNAL_ERROR",message:"No se pudo completar la operación. Revisa los datos e inténtalo de nuevo."},requestId};}
}

