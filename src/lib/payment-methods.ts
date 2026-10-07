const methods=["Efectivo","Transferencia bancaria","Nequi","Daviplata","Tarjeta débito","Tarjeta crédito","Otro"];

export function paymentMethodOptions(current?:unknown){
 const saved=current==null?"":String(current);
 const values=saved&&!methods.includes(saved)?[...methods,saved]:methods;
 return values.map(value=>({value,label:value}));
}
