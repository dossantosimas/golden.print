import { filamentColorBackground } from "@/lib/filament-color";

export function FilamentColorSwatch({value}: {value: unknown}) {
  const background = filamentColorBackground(value);
  return <span className={background ? "color-swatch" : "color-swatch color-swatch-unknown"} style={background ? {background} : undefined} aria-hidden="true" title={background ? "Referencia visual del color" : "Sin muestra: utiliza nombres comunes separados por / o códigos hexadecimales"}/>;
}

export function FilamentColor({value}: {value: unknown}) {
  return <span className="filament-color"><FilamentColorSwatch value={value}/><span>{String(value ?? "—")}</span></span>;
}
