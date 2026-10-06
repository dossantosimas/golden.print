import { resolveFilamentColor } from "@/lib/filament-color";

export function FilamentColor({value}: {value: unknown}) {
  const color = resolveFilamentColor(value);
  return <span className="filament-color"><span className={color ? "color-swatch" : "color-swatch color-swatch-unknown"} style={color ? {backgroundColor: color} : undefined} aria-hidden="true" title={color ? "Referencia visual del color" : "Sin muestra: utiliza un nombre común o un código hexadecimal"}/><span>{String(value ?? "—")}</span></span>;
}
