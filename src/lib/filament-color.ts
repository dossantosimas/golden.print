// Names remain valid catalog values; swatches are an approximate screen reference.
export const filamentColors: Record<string, string> = {
  negro: "#202124", blanco: "#ffffff", gris: "#858b92", rojo: "#dc3434",
  azul: "#2563eb", verde: "#27854a", amarillo: "#f3ce32", naranja: "#ef8532",
  morado: "#874bc1", violeta: "#874bc1", rosado: "#ef8eb4", rosa: "#ef8eb4",
  dorado: "#c5a35f", plateado: "#bcc2cb", cafe: "#805537", marron: "#805537",
  beige: "#dbccb1", azulmarino: "#1f355f", azulcielo: "#74bcea", turquesa: "#38b9b2",
  verdelimon: "#b7e532", piel: "#edc4a5", madera: "#b8875b",
};

export function resolveFilamentColor(value: unknown): string | null {
  const text = String(value ?? "").trim();
  if (/^#[\da-f]{6}$/i.test(text)) return text.toLowerCase();
  if (/^#[\da-f]{3}$/i.test(text)) return "#" + [...text.slice(1)].map(c => c + c).join("").toLowerCase();
  const key = text.normalize("NFD").replace(/[\u0300-\u036f\s-]/g, "").toLowerCase();
  return Object.hasOwn(filamentColors, key) ? filamentColors[key] : null;
}
