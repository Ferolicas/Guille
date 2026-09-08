"use client";

import { ArrowLeft, ArrowRight, ArrowUpRight, Image as ImageIcon, Play, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

export type GalleryMedia = {
  src: string;
  type: "image" | "video";
  label: "before" | "after" | "single";
  poster?: string;
};

export type GalleryItem = {
  id?: string;
  slot: number;
  title: string;
  description: string;
  media: GalleryMedia[];
  sourceUrl?: string;
};

function labelText(media: GalleryMedia) {
  if (media.label === "before") return "Antes";
  if (media.label === "after") return "Después";
  return media.type === "video" ? "Vídeo" : "Imagen única";
}

function subscribeToMotionPreference(callback: () => void) {
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  preference.addEventListener("change", callback);
  return () => preference.removeEventListener("change", callback);
}

function motionPreference() {
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function PortfolioGallery({ items }: { items: GalleryItem[] }) {
  const railRef = useRef<HTMLDivElement>(null);
  const [activeMedia, setActiveMedia] = useState<Record<string, number>>({});
  const [openVideoIndex, setOpenVideoIndex] = useState<number | null>(null);
  const allowMotion = useSyncExternalStore(subscribeToMotionPreference, motionPreference, () => false);
  const videos = useMemo(() => items.flatMap((item) => item.media
    .filter((media) => media.type === "video")
    .map((media) => ({
      key: `${item.id || item.slot}-${media.src}`,
      title: item.title || `Trabajo ${item.slot}`,
      description: item.description,
      media,
    }))), [items]);
  const openVideo = openVideoIndex === null ? null : videos[openVideoIndex];

  useEffect(() => {
    if (!allowMotion || openVideoIndex !== null) return;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      setActiveMedia((current) => Object.fromEntries(items.map((item) => {
        const key = item.id || String(item.slot);
        return [key, item.media.length > 1 ? ((current[key] ?? 0) + 1) % item.media.length : 0];
      })));
    }, 4200);
    return () => window.clearInterval(timer);
  }, [allowMotion, items, openVideoIndex]);

  useEffect(() => {
    if (openVideoIndex === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenVideoIndex(null);
      if (event.key === "ArrowLeft") setOpenVideoIndex((current) => current === null ? null : (current - 1 + videos.length) % videos.length);
      if (event.key === "ArrowRight") setOpenVideoIndex((current) => current === null ? null : (current + 1) % videos.length);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [openVideoIndex, videos.length]);

  function move(direction: -1 | 1) {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * rail.clientWidth * 0.84, behavior: "smooth" });
  }

  function showVideo(src: string) {
    const index = videos.findIndex((video) => video.media.src === src);
    if (index >= 0) setOpenVideoIndex(index);
  }

  function moveVideo(direction: -1 | 1) {
    setOpenVideoIndex((current) => current === null ? null : (current + direction + videos.length) % videos.length);
  }

  return (
    <div className="gallery-wrap">
      <div className="gallery-controls">
        <p>Desliza para ver {items.length === 1 ? "el trabajo" : `los ${items.length} trabajos`}</p>
        <div>
          <button type="button" onClick={() => move(-1)} aria-label="Ver trabajos anteriores"><ArrowLeft size={18} /></button>
          <button type="button" onClick={() => move(1)} aria-label="Ver trabajos siguientes"><ArrowRight size={18} /></button>
        </div>
      </div>
      <div className="gallery-rail" ref={railRef}>
        {items.map((item) => {
          const itemKey = item.id || String(item.slot);
          const currentIndex = Math.min(activeMedia[itemKey] ?? 0, Math.max(item.media.length - 1, 0));
          const current = item.media[currentIndex];
          return (
            <article className={`gallery-card ${current ? "gallery-card-ready" : "gallery-card-empty"}`} key={itemKey}>
              <div className="gallery-media">
                {current?.type === "image" && <Image src={current.src} alt={item.title || `Trabajo ${item.slot}`} fill sizes="(max-width: 640px) 45vw, 28vw" unoptimized />}
                {current?.type === "video" && (
                  <button className="gallery-video-trigger" type="button" onClick={() => showVideo(current.src)} aria-label={`Reproducir ${item.title || `trabajo ${item.slot}`}`}>
                    {current.poster ? <Image src={current.poster} alt="" fill sizes="(max-width: 640px) 45vw, 28vw" unoptimized /> : <video src={current.src} muted playsInline preload="metadata" />}
                    <span><Play size={16} fill="currentColor" /> Reproducir</span>
                  </button>
                )}
                {!current && <div className="gallery-placeholder"><span>{String(item.slot).padStart(2, "0")}</span><ImageIcon size={28} /><strong>Próximamente</strong><small>Nuevos trabajos documentados</small></div>}
                {current && <span className="gallery-current-label">{current.type === "video" && <Play size={11} fill="currentColor" />} {labelText(current)}</span>}
              </div>
              <div className="gallery-card-copy">
                <span>Trabajo {String(item.slot).padStart(2, "0")}</span>
                <h3>{item.title || "Próximo caso real"}</h3>
                <p>{item.description || "Aquí podrás ver el punto de partida, el proceso y el resultado de una intervención realizada por Guillo."}</p>
                {item.media.length > 1 && <div className="gallery-switch" aria-label="Cambiar entre antes y después">{item.media.map((media, index) => <button className={currentIndex === index ? "active" : ""} type="button" key={`${media.src}-${index}`} onClick={() => setActiveMedia((active) => ({ ...active, [itemKey]: index }))}>{labelText(media)}</button>)}</div>}
                {item.sourceUrl && <a className="gallery-source" href={item.sourceUrl} target="_blank" rel="noreferrer">Ver publicación <ArrowUpRight size={12} /></a>}
              </div>
            </article>
          );
        })}
      </div>
      {openVideo && openVideoIndex !== null && (
        <div className="gallery-player-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpenVideoIndex(null); }}>
          <div className="gallery-player" role="dialog" aria-modal="true" aria-labelledby="gallery-player-title">
            <header><div><span>Trabajo en vídeo</span><strong>{openVideoIndex + 1} de {videos.length}</strong></div><button type="button" onClick={() => setOpenVideoIndex(null)} aria-label="Cerrar vídeo"><X size={21} /></button></header>
            <div className="gallery-player-media"><video key={openVideo.media.src} src={openVideo.media.src} poster={openVideo.media.poster} controls autoPlay playsInline preload="metadata" /></div>
            <footer>
              <div><h2 id="gallery-player-title">{openVideo.title}</h2><p>{openVideo.description}</p></div>
              <nav aria-label="Cambiar vídeo"><button type="button" onClick={() => moveVideo(-1)}><ArrowLeft size={17} /> Anterior</button><button type="button" onClick={() => moveVideo(1)}>Siguiente <ArrowRight size={17} /></button></nav>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
