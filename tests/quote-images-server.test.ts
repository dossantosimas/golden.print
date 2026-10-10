import { describe, expect, it, vi } from "vitest";
import sharp from "sharp";
import { PDFDocument, PDFName, PDFDict } from "pdf-lib";
import { mkdir, writeFile } from "node:fs/promises";
import { normalizeQuoteImage } from "../src/lib/quote-image-service";
import { renderCommercialQuote } from "../src/lib/quote-pdf";
import { MAX_STORED_IMAGE_BYTES } from "../src/lib/quote-images";

vi.mock("server-only", () => ({}));

describe("imágenes privadas y PDF comercial", () => {
  it("rechaza contenido que no sea una imagen y optimiza dimensiones y tamaño", async () => {
    await expect(normalizeQuoteImage(Buffer.from("<svg>no permitido</svg>"))).rejects.toMatchObject({code:"VALIDATION_ERROR"});
    const png=await sharp({create:{width:2400,height:1200,channels:4,background:"#ad855c"}}).png().toBuffer();
    const result=await normalizeQuoteImage(png);
    expect(result.info.width).toBe(1600);
    expect(result.info.height).toBe(800);
    expect(result.data.length).toBeLessThanOrEqual(MAX_STORED_IMAGE_BYTES);
    expect((await sharp(result.data).metadata()).format).toBe("jpeg");
  });
  it("incluye diez fotos en cinco páginas de anexos, además del documento comercial", async () => {
    const images=await Promise.all(Array.from({length:10},async(_,index)=>({
      title:`Imagen ${index+1}: Referencia de fabricación — vista ${index+1}`,
      bytes:await sharp({create:{width:index%2?200:600,height:index%2?600:200,channels:3,
        background:index%2?"#348779":"#ad855c"}}).jpeg().toBuffer(),
    })));
    images[0].title="W".repeat(120);
    // Simulate database-decoded bytes in a pooled/sliced Buffer.
    images[0].bytes=Buffer.concat([Buffer.alloc(64),images[0].bytes]).subarray(64);
    const bytes=await renderCommercialQuote({code:"COT-IMÁGENES",revisionNumber:1,status:"sent",projectName:"Pieza con referencias",
      description:"Prueba de imágenes horizontales y verticales",customerName:"Cliente de prueba",price:"30000",businessDate:"2026-10-10",images});
    const doc=await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(6);
    let imageCount=0;
    for(const page of doc.getPages().slice(1)) {
      const objects=page.node.Resources()?.lookup(PDFName.of("XObject"),PDFDict);
      // Each appendix has the brand emblem and two reference images.
      expect(objects?.keys()).toHaveLength(3);
      imageCount+=(objects?.keys().length??1)-1;
    }
    expect(imageCount).toBe(10);
    expect(bytes.length).toBeLessThan(4_000_000);
    await mkdir("output/pdf",{recursive:true});
    await writeFile("output/pdf/quote-images-preview.pdf",bytes);
    await expect(renderCommercialQuote({code:"COT",revisionNumber:1,status:"draft",projectName:"Pieza",description:"",
      customerName:"Cliente",price:"1",businessDate:"2026-10-10",images:[...images,images[0]]})).rejects.toThrow("Máximo 10");
  });
});
