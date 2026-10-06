import Decimal from "decimal.js";
export const money=(value:unknown)=>value===null||value===undefined?"—":new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(BigInt(new Decimal(String(value)).toDecimalPlaces(0,Decimal.ROUND_HALF_UP).toFixed(0)));
export const statusLabels:Record<string,string>={failed:"Fallido",succeeded:"Completado",monetary:"Monetario",nonmonetary:"Asignación sin pago",nonvariable:"No variable",in:"Entrada",out:"Salida",draft:"Borrador",sent:"Enviada",accepted:"Aceptada",rejected:"Rechazada",not_started:"Sin empezar",printing:"Imprimiendo",finished:"Terminado",delivered:"Entregado",closed:"Cerrado",damaged:"Dañado",complete:"Completo",incomplete:"Incompleto",paid:"Pagado",pending:"Pendiente",administrator:"Administrador",operator:"Operador",opex:"Operativo",material_purchase:"Compra de material",variable:"Variable",fixed:"Fijo"};
export function display(value:unknown):string{if(value===null||value===undefined)return "—";if(typeof value==="object")return String((value as Record<string,unknown>).name??"—");if(typeof value==="boolean")return value?"Activo":"Inactivo";return statusLabels[String(value)]??String(value);}


export const decimalInput=(value:unknown)=>value===null||value===undefined||value===""?"":new Decimal(String(value)).toFixed(1,Decimal.ROUND_HALF_UP);
export const oneDecimal=(value:unknown)=>{if(value===null||value===undefined)return "—";const [whole,fraction]=decimalInput(value).split(".");return (whole==="-0"?"-":"")+new Intl.NumberFormat("es-CO").format(BigInt(whole))+","+fraction;};
export const unitMoney=(value:unknown)=>value===null||value===undefined?"—":oneDecimal(value)+" COP/g";



export const percentage=(value:unknown)=>{const [whole,fraction]=new Decimal(String(value)).toFixed(2).split(".");return (whole==="-0"?"-":"")+new Intl.NumberFormat("es-CO").format(BigInt(whole))+","+fraction+" %";};
