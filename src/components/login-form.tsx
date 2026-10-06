"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, Mail, LockKeyhole } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupInput, InputGroupAddon, InputGroupButton } from "@/components/ui/input-group";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";

export function LoginForm() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    setPending(true); setError("");
    try {
      const response = await authClient.signIn.email({ email: String(data.get("email")), password: String(data.get("password")) });
      if (response.error) setError("No pudimos iniciar sesión. Revisa tu correo y contraseña.");
      else { router.replace("/dashboard"); router.refresh(); }
    } catch { setError("No pudimos conectar. Intenta de nuevo en unos momentos."); }
    finally { setPending(false); }
  }
  return <form onSubmit={submit} className="flex flex-col gap-6">
    <FieldGroup>
      <Field data-disabled={pending}><FieldLabel htmlFor="email">Correo electrónico</FieldLabel><div className="login-email-control"><Mail className="login-mobile-input-icon" aria-hidden="true" /><Input className="h-11" id="email" name="email" type="email" autoComplete="username" required disabled={pending} /></div></Field>
      <Field data-disabled={pending}><FieldLabel htmlFor="password">Contraseña</FieldLabel><InputGroup className="h-11"><LockKeyhole className="login-mobile-input-icon" aria-hidden="true" /><InputGroupInput className="h-full min-h-0" id="password" name="password" type={visible ? "text" : "password"} autoComplete="current-password" required disabled={pending} /><InputGroupAddon align="inline-end"><InputGroupButton type="button" aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? <EyeOff /> : <Eye />}</InputGroupButton></InputGroupAddon></InputGroup></Field>
    </FieldGroup>
    {error && <Alert variant="destructive" role="alert"><AlertTitle>No se pudo ingresar</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
    <Button type="submit" disabled={pending}>{pending ? <Spinner data-icon="inline-start" /> : <ArrowRight data-icon="inline-start" />}{pending ? "Ingresando…" : "Iniciar sesión"}</Button>
    <p className="text-sm text-muted-foreground">¿Necesitas acceso? Solicita ayuda al administrador.</p>
  </form>;
}
