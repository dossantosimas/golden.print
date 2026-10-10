import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { quoteImagesSchema } from "../src/lib/quote-images";

describe("imágenes de cotización", () => {
  it("admite hasta diez imágenes y limpia los títulos", () => {
    const images = Array.from({ length: 10 }, () => ({ id: randomUUID(), title: "  Vista frontal  " }));
    expect(quoteImagesSchema.parse(images).every(image => image.title === "Vista frontal")).toBe(true);
    expect(quoteImagesSchema.safeParse([...images, { id: randomUUID() }]).success).toBe(false);
  });
  it("rechaza imágenes duplicadas, identificadores inválidos y títulos demasiado largos", () => {
    const image = { id: randomUUID(), title: "Referencia" };
    expect(quoteImagesSchema.safeParse([image, image]).success).toBe(false);
    expect(quoteImagesSchema.safeParse([{ id: "https://example.com/image.jpg" }]).success).toBe(false);
    expect(quoteImagesSchema.safeParse([{ ...image, title: "a".repeat(121) }]).success).toBe(false);
    expect(quoteImagesSchema.parse([{ id: image.id }])[0].title).toBe("");
  });
});
