import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Golden Print 3D", description: "Gestión interna de Golden Print 3D" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="es-CO"><body>{children}</body></html>; }
