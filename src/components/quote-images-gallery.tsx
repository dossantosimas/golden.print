import Image from "next/image";
import {Card,CardHeader,CardTitle,CardDescription,CardContent} from "@/components/ui/card";
import {quoteImageUrl,type QuoteImage} from "@/lib/quote-images";

export function QuoteImagesGallery({images}:{images:QuoteImage[]}){
 if(!images.length)return null;
 return <Card><CardHeader><CardTitle>Imágenes de la cotización</CardTitle><CardDescription>Incluidas en el PDF de esta revisión.</CardDescription></CardHeader><CardContent><div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{images.map((image,index)=><figure key={image.id} className="min-w-0 rounded-lg border p-3"><Image src={quoteImageUrl(image.id)} alt={image.title||`Imagen ${index+1}`} width={400} height={300} unoptimized className="h-44 w-full rounded-md bg-muted/40 object-contain"/><figcaption className="mt-3 break-words text-sm font-medium">{image.title||`Imagen ${index+1}`}</figcaption></figure>)}</div></CardContent></Card>;
}
