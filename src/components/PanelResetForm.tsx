"use client";

import { ArrowRight, Eye, EyeOff, LoaderCircle, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Brand } from "@/components/Brand";

export function PanelResetForm({ token }: { token: string }) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") || "");
    const confirmation = String(data.get("confirmation") || "");
    if (password !== confirmation) {
      setError("Las contraseñas no coinciden.");
      setBusy(false);
      return;
    }
    try {
      const response = await fetch("/api/panel/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const result = await response.json() as { ok?: boolean; message?: string };
      if (!response.ok || !result.ok) throw new Error(result.message || "No se pudo cambiar la contraseña.");
      router.replace("/panel");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo cambiar la contraseña.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="panel-auth-page">
      <div className="panel-auth-art" aria-hidden="true"><span>∞</span><p>Acceso seguro.<br />Trabajo continuo.</p></div>
      <section className="panel-auth-card">
        <Brand />
        <div className="panel-auth-heading"><span><ShieldCheck size={19} /></span><p>Enlace verificado</p><h1>Nueva contraseña</h1><small>Debe tener 10 caracteres o más, mayúscula, minúscula, número y símbolo.</small></div>
        <form onSubmit={submit}>
          <label className="field"><span>Nueva contraseña</span><div className="password-input"><input autoFocus name="password" type={show ? "text" : "password"} autoComplete="new-password" minLength={10} required /><button type="button" onClick={() => setShow((visible) => !visible)} aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
          <label className="field"><span>Repite la contraseña</span><input name="confirmation" type={show ? "text" : "password"} autoComplete="new-password" minLength={10} required /></label>
          {error && <p className="panel-message error" role="alert">{error}</p>}
          <button className="button form-submit" type="submit" disabled={busy}>{busy ? <><LoaderCircle className="spinner" size={18} /> Guardando…</> : <>Cambiar y entrar <ArrowRight size={18} /></>}</button>
        </form>
      </section>
    </main>
  );
}
