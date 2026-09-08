"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  FilePlus2,
  LoaderCircle,
  Music2,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type MouseEvent as ReactMouseEvent } from "react";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { findService, generalService, type ServiceCatalogItem } from "@/lib/service-catalog";

type SubmitState =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

type ContactDetails = {
  name: string;
  phone: string;
  email: string;
  city: string;
  message: string;
  consent: boolean;
};

const emptyDetails: ContactDetails = {
  name: "",
  phone: "",
  email: "",
  city: "",
  message: "",
  consent: false,
};

function fileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function dispatchQuote(service = generalService.slug) {
  window.dispatchEvent(new CustomEvent("guillo:open-quote", { detail: { service } }));
}

export function QuoteDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [service, setService] = useState<ServiceCatalogItem>(generalService);
  const [details, setDetails] = useState<ContactDetails>(emptyDetails);
  const [files, setFiles] = useState<File[]>([]);
  const [state, setState] = useState<SubmitState>({ status: "idle" });
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const firstStepRef = useRef<HTMLFieldSetElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function openFor(slug?: string) {
      setService(findService(slug));
      setStep(1);
      setFiles([]);
      setDetails(emptyDetails);
      setState({ status: "idle" });
      setStartedAt(Date.now());
      setOpen(true);
    }

    function delegatedClick(event: globalThis.MouseEvent) {
      const trigger = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-quote-service]");
      if (!trigger) return;
      event.preventDefault();
      openFor(trigger.dataset.quoteService);
    }

    function customOpen(event: Event) {
      openFor((event as CustomEvent<{ service?: string }>).detail?.service);
    }

    document.addEventListener("click", delegatedClick);
    window.addEventListener("guillo:open-quote", customOpen);
    const linkedService = new URLSearchParams(window.location.search).get("valoracion");
    if (linkedService) openFor(linkedService);
    return () => {
      document.removeEventListener("click", delegatedClick);
      window.removeEventListener("guillo:open-quote", customOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timeout = window.setTimeout(() => dialogRef.current?.querySelector<HTMLElement>("input, textarea, button")?.focus(), 40);
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && state.status !== "sending") setOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, state.status]);

  function update<K extends keyof ContactDetails>(key: K, value: ContactDetails[K]) {
    setDetails((current) => ({ ...current, [key]: value }));
    if (state.status === "error") setState({ status: "idle" });
  }

  function nextStep() {
    const fields = firstStepRef.current?.querySelectorAll<HTMLInputElement>("input");
    for (const field of fields ?? []) {
      if (!field.reportValidity()) return;
    }
    setStep(2);
    window.setTimeout(() => dialogRef.current?.querySelector<HTMLTextAreaElement>("textarea")?.focus(), 30);
  }

  function addFiles(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    const tooLarge = selected.find((file) => file.size > 200 * 1024 * 1024);
    if (tooLarge) {
      setState({ status: "error", message: `${tooLarge.name} supera el máximo de 200 MB.` });
      event.target.value = "";
      return;
    }
    if (files.length + selected.length > 3) {
      setState({ status: "error", message: "Puedes adjuntar un máximo de 3 archivos." });
      event.target.value = "";
      return;
    }
    setFiles((current) => [...current, ...selected]);
    setState({ status: "idle" });
    event.target.value = "";
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.status === "sending") return;
    setState({ status: "sending" });
    const payload = new FormData();
    payload.set("name", details.name);
    payload.set("phone", details.phone);
    payload.set("email", details.email);
    payload.set("city", details.city);
    payload.set("service", service.title);
    payload.set("message", details.message);
    payload.set("consent", String(details.consent));
    payload.set("website", "");
    payload.set("startedAt", String(startedAt));
    payload.set("source", `modal:${service.slug}`);
    files.forEach((file) => payload.append("files", file, file.name));

    try {
      const response = await fetch("/api/leads", { method: "POST", body: payload });
      const result = await response.json() as { ok?: boolean; message?: string };
      if (!response.ok || !result.ok) throw new Error(result.message || "No se pudo enviar la solicitud.");
      setState({ status: "success", message: result.message || "Solicitud recibida." });
    } catch (error) {
      setState({ status: "error", message: error instanceof Error ? error.message : "Ha ocurrido un error." });
    }
  }

  function closeFromBackdrop(event: ReactMouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget && state.status !== "sending") setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="quote-modal-backdrop" onMouseDown={closeFromBackdrop}>
      <div className="quote-modal" role="dialog" aria-modal="true" aria-labelledby="quote-modal-title" ref={dialogRef}>
        <header className="quote-modal-header">
          <div className="quote-modal-brand"><span>G</span><div><strong>GUILLO GUAMBI</strong><small>VALORACIÓN DE PROYECTO</small></div></div>
          <button className="icon-button" type="button" onClick={() => setOpen(false)} disabled={state.status === "sending"} aria-label="Cerrar formulario"><X size={20} /></button>
        </header>

        {state.status === "success" ? (
          <div className="quote-success">
            <span><CheckCircle2 size={30} /></span>
            <p className="modal-kicker">Solicitud enviada</p>
            <h2 id="quote-modal-title">Ya tenemos la información.</h2>
            <p>{state.message}</p>
            <button className="button button-primary" type="button" onClick={() => setOpen(false)}>Cerrar</button>
          </div>
        ) : (
          <form className="quote-form" onSubmit={submit}>
            <div className="quote-service-intro">
              <div>
                <p className="modal-kicker">{step === 1 ? "Tus datos" : "Tu proyecto"} · paso {step} de 2</p>
                <h2 id="quote-modal-title">{service.title}</h2>
              </div>
              <p>{service.includes}</p>
            </div>
            <div className="step-progress" aria-hidden="true"><span className={step === 2 ? "complete" : ""} /></div>

            {step === 1 ? (
              <fieldset className="quote-step quote-step-one" ref={firstStepRef}>
                <legend className="sr-only">Datos de contacto</legend>
                <label className="field field-wide"><span>Nombre *</span><input autoFocus value={details.name} onChange={(event) => update("name", event.target.value)} name="name" autoComplete="name" minLength={2} maxLength={120} required placeholder="Tu nombre" /></label>
                <div className="field-pair">
                  <label className="field"><span>Teléfono *</span><input value={details.phone} onChange={(event) => update("phone", event.target.value)} name="phone" type="tel" inputMode="tel" autoComplete="tel" minLength={7} maxLength={30} required placeholder="600 000 000" /></label>
                  <label className="field"><span>Email *</span><input value={details.email} onChange={(event) => update("email", event.target.value)} name="email" type="email" inputMode="email" autoComplete="email" maxLength={320} required placeholder="tu@email.com" /></label>
                </div>
                <label className="field"><span>Población *</span><input value={details.city} onChange={(event) => update("city", event.target.value)} name="city" autoComplete="address-level2" minLength={2} maxLength={120} required placeholder="Barcelona" /></label>
                <label className="field"><span>¿Qué necesitas?</span><input value={service.title} readOnly aria-readonly="true" /></label>
                <button className="button form-submit" type="button" onClick={nextStep}>Siguiente <ArrowRight size={18} /></button>
              </fieldset>
            ) : (
              <fieldset className="quote-step quote-step-two">
                <legend className="sr-only">Descripción y archivos del proyecto</legend>
                <label className="field project-message"><span>Cuéntame tu proyecto *</span><textarea autoFocus value={details.message} onChange={(event) => update("message", event.target.value)} name="message" rows={4} minLength={12} maxLength={3000} required placeholder="Qué ocurre, qué quieres cambiar y cuándo te gustaría empezar…" /></label>
                <div className="file-uploader">
                  <label className="file-picker"><FilePlus2 size={18} /><span><strong>Subir foto, vídeo o archivo</strong><small>Máximo 3 · 200 MB cada uno</small></span><input type="file" multiple onChange={addFiles} /></label>
                  {files.length > 0 && <ul className="file-list">{files.map((file, index) => <li key={`${file.name}-${file.lastModified}-${index}`}><span><strong>{file.name}</strong><small>{fileSize(file.size)}</small></span><button type="button" onClick={() => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Quitar ${file.name}`}><Trash2 size={15} /></button></li>)}</ul>}
                </div>
                <label className="form-consent"><input checked={details.consent} onChange={(event) => update("consent", event.target.checked)} name="consent" type="checkbox" required /><span>Acepto que Guillo Guambi use estos datos y archivos únicamente para estudiar y responder mi solicitud.</span></label>
                {state.status === "error" && <p className="form-error" role="alert">{state.message}</p>}
                <div className="quote-form-actions">
                  <button className="button button-back" type="button" onClick={() => setStep(1)} disabled={state.status === "sending"}><ArrowLeft size={17} /> Atrás</button>
                  <button className="button form-submit" type="submit" disabled={state.status === "sending"}>{state.status === "sending" ? <><LoaderCircle className="spinner" size={18} /> Comprimiendo y enviando…</> : <>Enviar solicitud <ArrowRight size={18} /></>}</button>
                </div>
              </fieldset>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

export function FloatingActions() {
  const [showValuation, setShowValuation] = useState(false);

  useEffect(() => {
    let frame = 0;
    function updateVisibility() {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const marker = document.getElementById("diagnostico");
        setShowValuation(Boolean(marker && window.scrollY >= marker.offsetTop - 72));
      });
    }
    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateVisibility);
      window.removeEventListener("resize", updateVisibility);
    };
  }, []);

  return (
    <>
      <div className="social-float" aria-label="Contacto y redes sociales">
        <a href="https://wa.me/34662569563?text=Hola%2C%20quiero%20mas%20informacion" target="_blank" rel="noreferrer" aria-label="Escribir por WhatsApp"><WhatsAppIcon size={21} aria-hidden="true" /></a>
        <a href="https://www.tiktok.com/@guilloguambi" target="_blank" rel="noreferrer" aria-label="Ver TikTok de Guillo Guambi"><Music2 size={20} /></a>
      </div>
      <button className={`mobile-cta ${showValuation ? "mobile-cta-visible" : ""}`} type="button" onClick={() => dispatchQuote()} aria-hidden={!showValuation} tabIndex={showValuation ? 0 : -1}>
        <Check size={17} /> Pedir valoración
      </button>
    </>
  );
}
