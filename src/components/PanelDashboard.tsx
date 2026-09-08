"use client";

import {
  ArrowUpRight,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  KeyRound,
  LayoutGrid,
  LoaderCircle,
  LogOut,
  Mail,
  Paperclip,
  Save,
  Trash2,
  UploadCloud,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Brand } from "@/components/Brand";
import type { GalleryItem, GalleryMedia } from "@/components/PortfolioGallery";
import type { GalleryVideoItem } from "@/lib/gallery";

export type PanelLead = {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  service: string;
  message: string;
  createdAt: string;
  files: Array<{ id: string; name: string; kind: string; size: number }>;
};

type Tab = "gallery" | "leads" | "security";

function bytes(value: number) {
  return value < 1024 * 1024 ? `${Math.round(value / 1024)} KB` : `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function MediaPreview({ media, index }: { media: GalleryMedia; index: number }) {
  return (
    <div className="panel-media-preview">
      {media.type === "video" ? <video src={media.src} muted controls preload="metadata" /> : <Image src={media.src} alt={`Archivo ${index + 1} de la tarjeta`} fill sizes="180px" unoptimized />}
      <span>{media.label === "before" ? "Antes" : media.label === "after" ? "Después" : "Imagen única"}</span>
    </div>
  );
}

export function PanelDashboard({ initialGallery, initialVideos, leads }: { initialGallery: GalleryItem[]; initialVideos: GalleryVideoItem[]; leads: PanelLead[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("gallery");
  const [gallery, setGallery] = useState(initialGallery);
  const [videos, setVideos] = useState(initialVideos);
  const [videoToDelete, setVideoToDelete] = useState<GalleryVideoItem | null>(null);
  const [deletingVideo, setDeletingVideo] = useState(false);
  const [videoMessage, setVideoMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [savingSlot, setSavingSlot] = useState<number | null>(null);
  const [slotMessages, setSlotMessages] = useState<Record<number, { type: "error" | "success"; text: string }>>({});
  const [passwordMessage, setPasswordMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  async function saveSlot(event: FormEvent<HTMLFormElement>, slot: number) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = new FormData(form);
    const uploaded = [payload.get("mediaOne"), payload.get("mediaTwo")].filter((value): value is File => value instanceof File && value.size > 0);
    const tooLarge = uploaded.find((file) => file.size > 200 * 1024 * 1024);
    if (tooLarge) {
      setSlotMessages((current) => ({ ...current, [slot]: { type: "error", text: `${tooLarge.name} supera 200 MB.` } }));
      return;
    }

    setSavingSlot(slot);
    setSlotMessages((current) => { const next = { ...current }; delete next[slot]; return next; });
    try {
      const response = await fetch(`/api/panel/gallery/${slot}`, { method: "POST", body: payload });
      const result = await response.json() as { ok?: boolean; item?: GalleryItem; message?: string };
      if (!response.ok || !result.ok || !result.item) throw new Error(result.message || "No se pudo guardar la tarjeta.");
      setGallery((current) => current.map((item) => item.slot === slot ? result.item! : item));
      form.querySelectorAll<HTMLInputElement>('input[type="file"], input[type="checkbox"]').forEach((input) => { input.value = ""; input.checked = false; });
      setSlotMessages((current) => ({ ...current, [slot]: { type: "success", text: result.message || "Cambios guardados." } }));
    } catch (error) {
      setSlotMessages((current) => ({ ...current, [slot]: { type: "error", text: error instanceof Error ? error.message : "No se pudo guardar." } }));
    } finally {
      setSavingSlot(null);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const currentPassword = String(data.get("currentPassword") || "");
    const newPassword = String(data.get("newPassword") || "");
    if (newPassword !== String(data.get("confirmation") || "")) {
      setPasswordMessage({ type: "error", text: "Las contraseñas nuevas no coinciden." });
      return;
    }
    setChangingPassword(true);
    setPasswordMessage(null);
    try {
      const response = await fetch("/api/panel/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const result = await response.json() as { ok?: boolean; message?: string };
      if (!response.ok || !result.ok) throw new Error(result.message || "No se pudo cambiar la contraseña.");
      form.reset();
      setPasswordMessage({ type: "success", text: result.message || "Contraseña cambiada." });
    } catch (error) {
      setPasswordMessage({ type: "error", text: error instanceof Error ? error.message : "No se pudo cambiar." });
    } finally {
      setChangingPassword(false);
    }
  }

  async function logout() {
    await fetch("/api/panel/logout", { method: "POST" });
    router.refresh();
  }

  async function deleteImportedVideo() {
    if (!videoToDelete || deletingVideo) return;
    setDeletingVideo(true);
    setVideoMessage(null);
    try {
      const response = await fetch(`/api/panel/gallery-videos/${videoToDelete.id}`, { method: "DELETE" });
      const result = await response.json() as { ok?: boolean; message?: string };
      if (!response.ok || !result.ok) throw new Error(result.message || "No se pudo eliminar el vídeo.");
      setVideos((current) => current.filter((video) => video.id !== videoToDelete.id));
      setVideoMessage({ type: "success", text: result.message || "Vídeo eliminado de la galería." });
      setVideoToDelete(null);
    } catch (error) {
      setVideoMessage({ type: "error", text: error instanceof Error ? error.message : "No se pudo eliminar el vídeo." });
    } finally {
      setDeletingVideo(false);
    }
  }

  return (
    <main className="panel-page">
      <header className="panel-header">
        <Brand />
        <div><a href="/" target="_blank">Ver web <ArrowUpRight size={15} /></a><button type="button" onClick={logout}><LogOut size={16} /> Salir</button></div>
      </header>

      <div className="panel-layout">
        <aside className="panel-sidebar">
          <div><p>Panel privado</p><strong>Contenido y solicitudes</strong></div>
          <nav aria-label="Secciones del panel">
            <button className={tab === "gallery" ? "active" : ""} type="button" onClick={() => setTab("gallery")}><LayoutGrid size={18} /> Galería <span>{videos.length + 6}</span></button>
            <button className={tab === "leads" ? "active" : ""} type="button" onClick={() => setTab("leads")}><Mail size={18} /> Solicitudes <span>{leads.length}</span></button>
            <button className={tab === "security" ? "active" : ""} type="button" onClick={() => setTab("security")}><KeyRound size={18} /> Seguridad</button>
          </nav>
          <p className="panel-sidebar-note">Los archivos de clientes son privados. Solo se abren con una sesión activa en este panel.</p>
        </aside>

        <div className="panel-main">
          {tab === "gallery" && (
            <section>
              <div className="panel-title"><div><p>Galería pública</p><h1>Trabajos publicados</h1></div><p>Los vídeos importados de TikTok aparecen primero. Puedes retirar cualquiera desde aquí; las seis tarjetas editables siguen disponibles para tus próximos antes y después.</p></div>
              <div className="panel-imported-heading"><div><span>Vídeos de TikTok</span><strong>{videos.length} publicados</strong></div><p>Eliminar un vídeo lo retira de la web y del almacenamiento. La publicación original de TikTok no se modifica.</p></div>
              {videoMessage && <p className={`panel-message panel-video-message ${videoMessage.type}`} role="status">{videoMessage.text}</p>}
              {videos.length > 0 ? (
                <div className="panel-video-grid">
                  {videos.map((video, index) => (
                    <article className="panel-video-card" key={video.id}>
                      <div className="panel-video-media"><video src={video.src} poster={video.poster} controls playsInline preload="none" /><span>{String(index + 1).padStart(2, "0")}</span></div>
                      <div className="panel-video-copy"><h2>{video.title}</h2><p>{video.description}</p></div>
                      <div className="panel-video-actions"><a href={video.sourceUrl} target="_blank" rel="noreferrer">Abrir TikTok <ArrowUpRight size={14} /></a><button type="button" onClick={() => setVideoToDelete(video)}><Trash2 size={15} /> Eliminar</button></div>
                    </article>
                  ))}
                </div>
              ) : <div className="panel-empty-state panel-empty-videos"><ImageIcon size={28} /><h2>No hay vídeos importados</h2><p>Las tarjetas manuales permanecen disponibles debajo.</p></div>}
              <div className="panel-manual-heading"><span>Tarjetas manuales</span><p>Sube uno o dos archivos por tarjeta. Con uno se mostrará como pieza única; con dos podrás decidir cuál es el antes y cuál el después.</p></div>
              <div className="panel-card-grid">
                {gallery.map((item) => (
                  <form className="panel-gallery-card" key={`${item.slot}-${item.media.map((media) => media.src).join("-")}`} onSubmit={(event) => saveSlot(event, item.slot)}>
                    <div className="panel-card-heading"><span>Tarjeta {String(item.slot).padStart(2, "0")}</span><strong>{item.media.length}/2 archivos</strong></div>
                    <div className="panel-current-media">
                      {item.media.length ? item.media.map((media, index) => <MediaPreview media={media} index={index} key={`${media.src}-${index}`} />) : <div className="panel-empty-media"><ImageIcon size={25} /><span>Sin contenido todavía</span></div>}
                    </div>
                    <label className="field"><span>Título</span><input name="title" defaultValue={item.title} maxLength={120} placeholder="Ej. Reforma de cocina en Gràcia" /></label>
                    <label className="field"><span>Descripción</span><textarea name="description" defaultValue={item.description} maxLength={1000} rows={3} placeholder="Qué se hizo y qué cambió en el espacio" /></label>
                    <div className="panel-upload-grid">
                      {[0, 1].map((index) => {
                        const existing = item.media[index];
                        return <div className="panel-upload-slot" key={index}><label><UploadCloud size={17} /><span>{existing ? `Reemplazar archivo ${index + 1}` : `Subir archivo ${index + 1}`}<small>Foto o vídeo · 200 MB máx.</small></span><input name={index === 0 ? "mediaOne" : "mediaTwo"} type="file" accept="image/*,video/*" /></label>{existing && <label className="remove-media"><input name={index === 0 ? "removeOne" : "removeTwo"} type="checkbox" value="true" /> Quitar al guardar</label>}</div>;
                      })}
                    </div>
                    <div className="panel-label-grid">
                      <label className="field"><span>Archivo 1</span><select name="labelOne" defaultValue={item.media[0]?.label === "after" ? "after" : "before"}><option value="before">Antes</option><option value="after">Después</option></select></label>
                      <label className="field"><span>Archivo 2</span><select name="labelTwo" defaultValue={item.media[1]?.label === "before" ? "before" : "after"}><option value="after">Después</option><option value="before">Antes</option></select></label>
                    </div>
                    {slotMessages[item.slot] && <p className={`panel-message ${slotMessages[item.slot].type}`} role="status">{slotMessages[item.slot].text}</p>}
                    <button className="button panel-save" type="submit" disabled={savingSlot === item.slot}>{savingSlot === item.slot ? <><LoaderCircle className="spinner" size={17} /> Comprimiendo…</> : <><Save size={17} /> Guardar tarjeta {item.slot}</>}</button>
                  </form>
                ))}
              </div>
            </section>
          )}

          {tab === "leads" && (
            <section>
              <div className="panel-title"><div><p>Entrada privada</p><h1>Solicitudes recientes</h1></div><p>Aquí quedan los datos y archivos guardados aunque un proveedor de correo falle o un adjunto sea demasiado grande.</p></div>
              <div className="panel-leads">
                {leads.length === 0 && <div className="panel-empty-state"><Mail size={28} /><h2>Todavía no hay solicitudes</h2><p>Cuando alguien complete el formulario aparecerá aquí.</p></div>}
                {leads.map((lead) => <article className="panel-lead" key={lead.id}><div className="panel-lead-top"><div><span>{new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(new Date(lead.createdAt))}</span><h2>{lead.name}</h2><p>{lead.service}</p></div><a href={`mailto:${lead.email}`}><Mail size={16} /> Responder</a></div><div className="panel-lead-details"><p><span>Teléfono</span><a href={`tel:${lead.phone.replace(/\s/g, "")}`}>{lead.phone}</a></p><p><span>Email</span><a href={`mailto:${lead.email}`}>{lead.email}</a></p><p><span>Población</span><strong>{lead.city}</strong></p></div><blockquote>{lead.message}</blockquote>{lead.files.length > 0 && <div className="panel-lead-files"><span><Paperclip size={15} /> Archivos privados</span>{lead.files.map((file) => <a href={`/api/panel/files/${file.id}`} target="_blank" key={file.id}>{file.kind === "document" ? <FileText size={17} /> : <ImageIcon size={17} />}<span><strong>{file.name}</strong><small>{bytes(file.size)}</small></span><ArrowUpRight size={14} /></a>)}</div>}</article>)}
              </div>
            </section>
          )}

          {tab === "security" && (
            <section>
              <div className="panel-title"><div><p>Acceso privado</p><h1>Seguridad</h1></div><p>Cambia la contraseña cuando lo necesites. Si la olvidas, usa el enlace de recuperación de la pantalla de acceso.</p></div>
              <form className="panel-security-card" onSubmit={changePassword}>
                <div className="panel-security-icon"><KeyRound size={23} /></div>
                <h2>Cambiar contraseña</h2>
                <p>La sesión seguirá activa en este dispositivo después del cambio.</p>
                <label className="field"><span>Contraseña actual</span><input name="currentPassword" type="password" autoComplete="current-password" required /></label>
                <label className="field"><span>Nueva contraseña</span><input name="newPassword" type="password" autoComplete="new-password" minLength={10} required /></label>
                <label className="field"><span>Repite la nueva contraseña</span><input name="confirmation" type="password" autoComplete="new-password" minLength={10} required /></label>
                <small>10 caracteres o más, con mayúscula, minúscula, número y símbolo.</small>
                {passwordMessage && <p className={`panel-message ${passwordMessage.type}`} role="status">{passwordMessage.text}</p>}
                <button className="button panel-save" type="submit" disabled={changingPassword}>{changingPassword ? <><LoaderCircle className="spinner" size={17} /> Guardando…</> : <><CheckCircle2 size={17} /> Cambiar contraseña</>}</button>
              </form>
            </section>
          )}
        </div>
      </div>

      {videoToDelete && (
        <div className="panel-confirm-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !deletingVideo) setVideoToDelete(null); }}>
          <div className="panel-confirm" role="alertdialog" aria-modal="true" aria-labelledby="delete-video-title" aria-describedby="delete-video-description">
            <span><Trash2 size={22} /></span>
            <p>Eliminar de la galería</p>
            <h2 id="delete-video-title">¿Retirar este vídeo?</h2>
            <p id="delete-video-description">“{videoToDelete.title}” dejará de aparecer en la web. La publicación original seguirá intacta en TikTok.</p>
            <div><button type="button" onClick={() => setVideoToDelete(null)} disabled={deletingVideo}>Cancelar</button><button className="danger" type="button" onClick={deleteImportedVideo} disabled={deletingVideo}>{deletingVideo ? <><LoaderCircle className="spinner" size={16} /> Eliminando…</> : <><Trash2 size={16} /> Sí, eliminar</>}</button></div>
          </div>
        </div>
      )}
    </main>
  );
}
