"use client";
import { useState, type ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { filamentColors, resolveFilamentColor } from "@/lib/filament-color";

type Props = Omit<ComponentProps<"input">, "defaultValue" | "value" | "onChange" | "type"> & {defaultValue?: string};
export function FilamentColorInput({defaultValue = "", ...props}: Props) {
  const [value, setValue] = useState(defaultValue);
  const color = resolveFilamentColor(value);
  return <div className="filament-color-input">
    <Input {...props} value={value} onChange={e => setValue(e.target.value)} list={`${props.id}-colors`} placeholder="Azul o #2563eb"/>
    <input type="color" className="color-picker" aria-label="Elegir color visual" title="Elegir color visual" value={color ?? "#858b92"} disabled={props.disabled} onChange={e => setValue(e.target.value)} />
    <datalist id={`${props.id}-colors`}>{Object.keys(filamentColors).map(name => <option key={name} value={name === "verdelimon" ? "Verde limón" : name.charAt(0).toUpperCase() + name.slice(1)} />)}</datalist>
  </div>;
}
