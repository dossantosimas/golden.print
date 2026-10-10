import {z} from "zod";

export const MAX_QUOTE_IMAGES=10;
export const MAX_IMAGE_UPLOAD_BYTES=2*1024*1024;
export const MAX_STORED_IMAGE_BYTES=300*1024;
export const quoteImagesSchema=z.array(z.object({id:z.uuid(),title:z.string().trim().max(120).default("")}).strict()).max(MAX_QUOTE_IMAGES,"Puedes agregar máximo 10 imágenes.").refine(images=>new Set(images.map(image=>image.id)).size===images.length,"No repitas la misma imagen.");
export type QuoteImage=z.infer<typeof quoteImagesSchema>[number];
export const quoteImageUrl=(id:string)=>`/api/quote-images/${id}`;
