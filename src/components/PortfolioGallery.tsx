"use client";

import { ArrowLeft, ArrowRight, ArrowUpRight, Image as ImageIcon, Play } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

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
  const allowMotion = useSyncExternalStore(subscribeToMotionPreference, motionPreference, () => false);

  useEffect(() => {
    if (!allowMotion) return;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      setActiveMedia((current) => Object.fromEntries(items.map((item) => {
        const key = item.id || String(item.slot);
        return [key, item.media.length > 1 ? ((current[key] ?? 0) + 1) % item.media.length : 0];
      })));
    }, 4200);
    return () => window.clearInterval(timer);
  }, [allowMotion, items]);

  function move(direction: -1 | 1) {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * rail.clientWidth * 0.84, behavior: "smooth" });
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
                {current?.type === "video" && <video key={current.src} src={current.src} poster={current.poster} autoPlay={allowMotion && item.media.length > 1} muted={item.media.length > 1} loop={item.media.length > 1} controls playsInline preload="none" />}
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
    </div>
  );
}
