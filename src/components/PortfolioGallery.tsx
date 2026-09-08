"use client";

import { ArrowLeft, ArrowRight, Image as ImageIcon, Play } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

export type GalleryMedia = {
  src: string;
  type: "image" | "video";
  label: "before" | "after" | "single";
};

export type GalleryItem = {
  slot: number;
  title: string;
  description: string;
  media: GalleryMedia[];
};

function labelText(label: GalleryMedia["label"]) {
  if (label === "before") return "Antes";
  if (label === "after") return "Después";
  return "Imagen única";
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
  const [activeMedia, setActiveMedia] = useState<Record<number, number>>({});
  const allowMotion = useSyncExternalStore(subscribeToMotionPreference, motionPreference, () => false);

  useEffect(() => {
    if (!allowMotion) return;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      setActiveMedia((current) => Object.fromEntries(items.map((item) => [
        item.slot,
        item.media.length > 1 ? ((current[item.slot] ?? 0) + 1) % item.media.length : 0,
      ])));
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
        <p>Desliza para ver las 6 tarjetas</p>
        <div>
          <button type="button" onClick={() => move(-1)} aria-label="Ver trabajos anteriores"><ArrowLeft size={18} /></button>
          <button type="button" onClick={() => move(1)} aria-label="Ver trabajos siguientes"><ArrowRight size={18} /></button>
        </div>
      </div>
      <div className="gallery-rail" ref={railRef}>
        {items.map((item) => {
          const currentIndex = Math.min(activeMedia[item.slot] ?? 0, Math.max(item.media.length - 1, 0));
          const current = item.media[currentIndex];
          return (
            <article className={`gallery-card ${current ? "gallery-card-ready" : "gallery-card-empty"}`} key={item.slot}>
              <div className="gallery-media">
                {current?.type === "image" && <Image src={current.src} alt={item.title || `Trabajo ${item.slot}`} fill sizes="(max-width: 640px) 45vw, 28vw" unoptimized />}
                {current?.type === "video" && <video key={current.src} src={current.src} autoPlay={allowMotion} muted loop playsInline preload="metadata" />}
                {!current && <div className="gallery-placeholder"><span>{String(item.slot).padStart(2, "0")}</span><ImageIcon size={28} /><strong>Espacio preparado</strong><small>Sube el primer trabajo desde /panel</small></div>}
                {current && <span className="gallery-current-label">{current.type === "video" && <Play size={11} fill="currentColor" />} {labelText(current.label)}</span>}
              </div>
              <div className="gallery-card-copy">
                <span>Trabajo {String(item.slot).padStart(2, "0")}</span>
                <h3>{item.title || "Título del proyecto"}</h3>
                <p>{item.description || "La descripción aparecerá aquí cuando completes esta tarjeta en el panel."}</p>
                {item.media.length > 1 && <div className="gallery-switch" aria-label="Cambiar entre antes y después">{item.media.map((media, index) => <button className={currentIndex === index ? "active" : ""} type="button" key={`${media.src}-${index}`} onClick={() => setActiveMedia((active) => ({ ...active, [item.slot]: index }))}>{labelText(media.label)}</button>)}</div>}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
