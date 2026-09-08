import { asc } from "drizzle-orm";
import { gallerySlots } from "@/db/schema";
import { db } from "@/lib/db";
import type { GalleryItem, GalleryMedia } from "@/components/PortfolioGallery";

function media(name: string | null, type: string | null, label: string | null): GalleryMedia | null {
  if (!name || (type !== "image" && type !== "video")) return null;
  const safeLabel = label === "before" || label === "after" ? label : "single";
  return { src: `/api/gallery-media/${encodeURIComponent(name)}`, type, label: safeLabel };
}

export async function getGalleryItems(): Promise<GalleryItem[]> {
  let stored: typeof gallerySlots.$inferSelect[] = [];
  try {
    if (process.env.SKIP_DB === "true") throw new Error("Galería en modo local sin base de datos.");
    stored = await db.select().from(gallerySlots).orderBy(asc(gallerySlots.slot));
  } catch (error) {
    if (process.env.SKIP_DB !== "true") console.error("No se pudo cargar la galería", error);
  }

  return Array.from({ length: 6 }, (_, index) => {
    const slot = index + 1;
    const row = stored.find((item) => item.slot === slot);
    const mediaItems = row
      ? [
          media(row.mediaOneName, row.mediaOneType, row.mediaOneLabel),
          media(row.mediaTwoName, row.mediaTwoType, row.mediaTwoLabel),
        ].filter((item): item is GalleryMedia => Boolean(item))
      : [];
    return {
      slot,
      title: row?.title || "",
      description: row?.description || "",
      media: mediaItems,
    };
  });
}
