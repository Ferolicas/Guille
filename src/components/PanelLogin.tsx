"use client";

import { ArrowLeft, ArrowRight, Eye, EyeOff, KeyRound, LoaderCircle, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Brand } from "@/components/Brand";

export function PanelLogin() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "recovery">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/panel/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: data.get("password") }),
      });
      const result = await response.json() as { ok?: boolean; message?: string };
      if (!response.ok || !result.ok) throw new Error(result.message || "No se pudo iniciar sesión.");
      router.refresh();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "No se pudo iniciar sesión." });
    } finally {
      setBusy(false);
    }
  }

  async function submitRecovery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/panel/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.get("email") }),
      });
      const result = await response.json() as { ok?: boolean; message?: string };
      if (!response.ok || !result.ok) throw new Error(result.message || "No se pudo enviar el enlace.");
      setMessage({ type: "success", text: result.message || "Revisa tu correo." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "No se pudo enviar el enlace." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="panel-auth-page">
      <div className="panel-auth-art" aria-hidden="true"><span>06</span><p>Tu trabajo.<br />Tu escaparate.</p></div>
      <section className="panel-auth-card">
        <Brand />
        {mode === "login" ? (
          <>
            <div className="panel-auth-heading"><span><KeyRound size={18} /></span><p>Acceso privado</p><h1>Panel de trabajos</h1><small>Gestiona las fotos, los vídeos y las tarjetas de la galería, y revisa las solicitudes recibidas.</small></div>
            <form onSubmit={submitLogin}>
              <label className="field"><span>Contraseña</span><div className="password-input"><input autoFocus name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
              {message && <p className={`panel-message ${message.type}`} role="alert">{message.text}</p>}
              <button className="button form-submit" type="submit" disabled={busy}>{busy ? <><LoaderCircle className="spinner" size={18} /> Entrando…</> : <>Entrar al panel <ArrowRight size={18} /></>}</button>
              <button className="panel-link-button" type="button" onClick={() => { setMode("recovery"); setMessage(null); }}>He olvidado la contraseña</button>
            </form>
          </>
        ) : (
          <>
            <div className="panel-auth-heading"><span><Mail size={18} /></span><p>Recuperar acceso</p><h1>Revisa tu correo</h1><small>Escribe el email de recuperación. Recibirás un enlace válido durante 30 minutos.</small></div>
            <form onSubmit={submitRecovery}>
              <label className="field"><span>Email de recuperación</span><input autoFocus name="email" type="email" autoComplete="email" required placeholder="tu@email.com" /></label>
              {message && <p className={`panel-message ${message.type}`} role="status">{message.text}</p>}
              <button className="button form-submit" type="submit" disabled={busy}>{busy ? <><LoaderCircle className="spinner" size={18} /> Enviando…</> : <>Enviar enlace seguro <ArrowRight size={18} /></>}</button>
              <button className="panel-link-button" type="button" onClick={() => { setMode("login"); setMessage(null); }}><ArrowLeft size={15} /> Volver al acceso</button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
