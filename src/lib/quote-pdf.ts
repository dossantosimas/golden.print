import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

// Commercial allowlist: the renderer cannot receive internalNotes or costs.
export type CommercialQuote = {
  code: string; revisionNumber: number; status: string; projectName: string;
  description: string; customerName: string; customerContact?: string;
  price: string; businessDate: string; validUntil?: string | null; customerNotes?: string | null;
};

function lines(text: string, font: PDFFont, size: number, width: number) {
  const output: string[] = [];
  const clean = text.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").replace(/\t/g, "    ");
  for (const paragraph of clean.split(/\r?\n/)) {
    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      if (!word) continue;
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= width) { line = candidate; continue; }
      if (line) { output.push(line); line = ""; }
      for (const character of word) {
        if (line && font.widthOfTextAtSize(line + character, size) > width) { output.push(line); line = ""; }
        line += character;
      }
    }
    output.push(line);
  }
  return output;
}

export async function renderCommercialQuote(data: CommercialQuote) {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const font = await doc.embedFont(await readFile(join(process.cwd(), "public/fonts/NotoSans-Regular.ttf")), { subset: true });
  const titleFont = await doc.embedFont(StandardFonts.TimesRomanBold);
  const emblem = await doc.embedPng(await readFile(join(process.cwd(), "public/brand/golden-print-emblem.png")));
  const ink=rgb(.165,.122,.09), gold=rgb(.55,.385,.157), pale=rgb(.981,.965,.922), paper=rgb(.988,.984,.973), muted=rgb(.43,.40,.35), border=rgb(.88,.85,.79), white=rgb(1,1,1);
  const width=595.28,height=841.89,left=42,bodyWidth=511.28,bottom=78;
  const amount="$ "+new Intl.NumberFormat("es-CO",{maximumFractionDigits:0}).format(BigInt(data.price));
  const states:Record<string,string>={draft:"BORRADOR",sent:"ENVIADA",accepted:"ACEPTADA",rejected:"RECHAZADA"};
  let page!:PDFPage,y=0;
  function text(value:string,x:number,top:number,size=10,color=ink,face=font){page.drawText(value,{x,y:top-size,size,font:face,color});}
  function right(value:string,x:number,top:number,size=10,color=ink){text(value,x-font.widthOfTextAtSize(value,size),top,size,color);}
  function box(x:number,top:number,w:number,h:number,fill=white){page.drawRectangle({x,y:top-h,width:w,height:h,color:fill,borderColor:border,borderWidth:.6});}
  function rule(top:number){page.drawLine({start:{x:left,y:top},end:{x:width-left,y:top},thickness:.7,color:border});}
  function addPage(){
    page=doc.addPage([width,height]);
    page.drawRectangle({x:0,y:0,width,height,color:paper});
    page.drawRectangle({x:0,y:height-6,width,height:6,color:gold});
    page.drawImage(emblem,{x:left,y:height-110,width:64,height:64});
    text("GOLDEN PRINT 3D",120,height-53,18,ink,titleFont);
    text("IMPRESIÓN 3D · DISEÑO Y FABRICACIÓN",120,height-80,8,gold);
    text("Colombia · Cotización comercial",120,height-96,8,muted);
    box(390,height-36,163,83,pale);
    text("COTIZACIÓN COMERCIAL",402,height-47,8,gold);
    const codeLines=lines(data.code,font,14,139);
    codeLines.slice(0,2).forEach((line,index)=>text(line,402,height-63-index*16,14));
    text(`Revisión ${data.revisionNumber} · ${states[data.status]??data.status}`,402,height-100,8,muted);
    rule(height-135);y=height-158;
  }
  function ensure(h:number){if(y-h<bottom)addPage();}
  function section(label:string){ensure(40);text(label,left,y,9,gold);y-=21;}
  function paragraph(label:string,value:string,fill=white){
    const wrapped=lines(value,font,10,bodyWidth-28);let offset=0;
    while(offset<wrapped.length){
      ensure(70);
      const count=Math.max(1,Math.min(wrapped.length-offset,Math.floor((y-bottom-42)/15)));
      const blockHeight=36+count*15;
      box(left,y,bodyWidth,blockHeight,fill);
      text(label+(offset?" (continuación)":""),left+14,y-11,8,gold);
      wrapped.slice(offset,offset+count).forEach((line,index)=>text(line,left+14,y-30-index*15,10));
      y-=blockHeight+16;offset+=count;
    }
  }
  addPage();
  const customerLines=lines(data.customerName,font,12,bodyWidth/2-38);
  const contactLines=data.customerContact?lines(data.customerContact,font,9,bodyWidth/2-38):[];
  const metaHeight=Math.max(96,42+customerLines.length*17+contactLines.length*14);
  // Client values are bounded by the application's commercial fields.
  box(left,y,bodyWidth/2-8,metaHeight);
  box(left+bodyWidth/2+8,y,bodyWidth/2-8,metaHeight);
  text("DATOS DEL CLIENTE",left+14,y-12,8,gold);
  customerLines.forEach((line,index)=>text(line,left+14,y-33-index*17,12));
  contactLines.forEach((line,index)=>text(line,left+14,y-36-customerLines.length*17-index*14,9,muted));
  const metaX=left+bodyWidth/2+22;
  text("DETALLES DE EMISIÓN",metaX,y-12,8,gold);
  text("Fecha comercial",metaX,y-34,8,muted);text(data.businessDate,metaX+106,y-33,10);
  text("Válida hasta",metaX,y-54,8,muted);text(data.validUntil??"Sin fecha definida",metaX+106,y-53,9);
  text("Moneda",metaX,y-74,8,muted);text("COP · Pesos colombianos",metaX+59,y-73,8);
  y-=metaHeight+24;
  section("ESPECIFICACIÓN DEL PROYECTO");
  const projectLines=lines(data.projectName,font,12,bodyWidth-170);
  const projectHeight=Math.max(63,34+projectLines.length*17);
  ensure(projectHeight+16);
  box(left,y,bodyWidth,projectHeight);
  page.drawRectangle({x:left,y:y-25,width:bodyWidth,height:25,color:pale});
  text("PROYECTO / SERVICIO COTIZADO",left+14,y-8,8,gold);
  right("VALOR COTIZADO",width-left-14,y-8,8,gold);
  projectLines.forEach((line,index)=>text(line,left+14,y-34-index*17,12));
  right(amount+" COP",width-left-14,y-36,11);
  y-=projectHeight+16;
  if(data.description)paragraph("DESCRIPCIÓN DEL PROYECTO",data.description);
  if(data.customerNotes)paragraph("OBSERVACIONES Y CONDICIONES ACORDADAS",data.customerNotes,pale);
  ensure(148);
  const totalTop=y,totalX=left+bodyWidth-235;
  box(totalX,totalTop,235,134,ink);
  text("RESUMEN COMERCIAL",totalX+16,totalTop-14,8,rgb(.82,.73,.57));
  text("Subtotal",totalX+16,totalTop-38,9,rgb(.88,.85,.79));
  right(amount,width-left-16,totalTop-37,10,white);
  page.drawLine({start:{x:totalX+16,y:totalTop-62},end:{x:width-left-16,y:totalTop-62},thickness:.5,color:gold});
  text("TOTAL A PAGAR",totalX+16,totalTop-75,9,rgb(.90,.75,.46));
  const totalSize=Math.min(24,170/font.widthOfTextAtSize(amount,1));
  text(amount,totalX+16,totalTop-92,totalSize,white);
  right("COP",width-left-16,totalTop-101,8,rgb(.90,.75,.46));
  text("Sin impuestos",totalX+16,totalTop-119,8,rgb(.88,.85,.79));
  text("GOLDEN PRINT 3D",left,totalTop-20,13,gold,titleFont);
  lines("Gracias por confiar en nuestro taller para materializar tus ideas.",font,10,bodyWidth-260).forEach((line,index)=>text(line,left,totalTop-48-index*15,10,muted));
  lines("Los detalles y condiciones acordados se describen en esta cotización.",font,8,bodyWidth-260).forEach((line,index)=>text(line,left,totalTop-95-index*12,8,muted));
  doc.getPages().forEach((p,index)=>{
    p.drawLine({start:{x:left,y:56},end:{x:width-left,y:56},thickness:.7,color:border});
    p.drawText(`Golden Print 3D · ${data.code} · Revisión ${data.revisionNumber}`,{x:left,y:40,size:8,font,color:muted});
    const number=`${index+1} / ${doc.getPageCount()}`;
    p.drawText(number,{x:width-left-font.widthOfTextAtSize(number,8),y:40,size:8,font,color:muted});
    p.drawRectangle({x:0,y:0,width,height:4,color:ink});
  });
  doc.setTitle(`Cotización ${data.code} · Golden Print 3D`);doc.setAuthor("Golden Print 3D");
  return doc.save();
}