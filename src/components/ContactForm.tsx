"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, LoaderCircle } from "lucide-react";

type FormState =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const serviceOptions = [
  "Reforma integral",
  "Humedades y saneado",
  "Pladur y albañilería",
  "Pintura y acabados",
  "Cocinas y baños",
  "Instalaciones y reparación",
  "Otro / necesito orientación",
];

export function ContactForm() {
  const [state, setState] = useState<FormState>({ status: "idle" });
  const [startedAt, setStartedAt] = useState(() => Date.now());

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.status === "sending") return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setState({ status: "sending" });

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          phone: data.get("phone"),
          email: data.get("email"),
          city: data.get("city"),
          service: data.get("service"),
          message: data.get("message"),
          consent: data.get("consent") === "on",
          website: data.get("website"),
          startedAt,
          source: "web-form",
        }),
      });
      const result = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !result.ok) throw new Error(result.message || "No se pudo enviar la solicitud.");
      form.reset();
      setStartedAt(Date.now());
      setState({ status: "success", message: result.message || "Solicitud recibida." });
    } catch (error) {
      setState({ status: "error", message: error instanceof Error ? error.message : "Ha ocurrido un error." });
    }
  }

  return (
    <form className="contact-form" onSubmit={submit}>
      <div className="form-heading"><span>Solicitud de valoración</span><strong>01 — 05</strong></div>
      <div className="form-row">
        <label><span>Nombre *</span><input name="name" autoComplete="name" minLength={2} maxLength={120} required placeholder="Tu nombre" /></label>
        <label><span>Teléfono *</span><input name="phone" type="tel" inputMode="tel" autoComplete="tel" minLength={7} maxLength={30} required placeholder="600 000 000" /></label>
      </div>
      <div className="form-row">
        <label><span>Email</span><input name="email" type="email" inputMode="email" autoComplete="email" maxLength={320} placeholder="tu@email.com" /></label>
        <label><span>Municipio</span><input name="city" autoComplete="address-level2" maxLength={120} placeholder="Barcelona" /></label>
      </div>
      <label><span>¿Qué necesitas? *</span><select name="service" defaultValue="" required><option value="" disabled>Selecciona una opción</option>{serviceOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
      <label><span>Cuéntame el proyecto *</span><textarea name="message" rows={5} minLength={12} maxLength={2000} required placeholder="Qué ocurre, qué quieres cambiar y cuándo te gustaría empezar…" /></label>
      <label className="honeypot" aria-hidden="true">Sitio web<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <label className="form-consent"><input name="consent" type="checkbox" required /><span>Acepto que Guillo Guambi use estos datos únicamente para estudiar y responder mi solicitud.</span></label>
      <button className="button form-submit" type="submit" disabled={state.status === "sending"}>
        {state.status === "sending" ? <><LoaderCircle className="spinner" size={18} /> Enviando…</> : <>Enviar mi solicitud <ArrowRight size={18} /></>}
      </button>
      <div className="form-status" role="status" aria-live="polite">
        {state.status === "success" && <p className="success"><CheckCircle2 size={19} /> {state.message}</p>}
        {state.status === "error" && <p className="error">{state.message}</p>}
      </div>
    </form>
  );
}
