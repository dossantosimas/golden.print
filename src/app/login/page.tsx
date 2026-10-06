import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return <main className="login-scene"><div className="login-brand" role="img" aria-label="Golden Print 3D, logo integrado en un fondo carbón y dorado" /><section className="login-panel" aria-labelledby="login-title"><div className="login-form-surface"><p className="brand-eyebrow">GOLDEN PRINT 3D</p><h1 id="login-title">Iniciar sesión</h1><p className="login-intro">Bienvenido a tu espacio de trabajo.</p><LoginForm /></div></section></main>;
}
