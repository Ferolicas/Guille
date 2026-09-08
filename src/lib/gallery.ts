import { asc } from "drizzle-orm";
import { gallerySlots, galleryVideos } from "@/db/schema";
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

export type GalleryVideoItem = {
  id: string;
  title: string;
  description: string;
  src: string;
  poster: string;
  sourceUrl: string;
};

export async function getGalleryVideos(): Promise<GalleryVideoItem[]> {
  try {
    if (process.env.SKIP_DB === "true") return [];
    const rows = await db.select().from(galleryVideos).orderBy(asc(galleryVideos.sortOrder), asc(galleryVideos.createdAt));
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      src: `/api/gallery-media/${encodeURIComponent(row.storageName)}`,
      poster: `/api/gallery-media/${encodeURIComponent(row.posterName)}`,
      sourceUrl: row.sourceUrl,
    }));
  } catch (error) {
    console.error("No se pudieron cargar los vídeos importados", error);
    return [];
  }
}

export async function getPublicGalleryItems(): Promise<GalleryItem[]> {
  const [manualItems, videos] = await Promise.all([getGalleryItems(), getGalleryVideos()]);
  const publicItems: GalleryItem[] = [
    ...videos.map((video, index) => ({
      id: video.id,
      slot: index + 1,
      title: video.title,
      description: video.description,
      sourceUrl: video.sourceUrl,
      media: [{ src: video.src, poster: video.poster, type: "video" as const, label: "single" as const }],
    })),
    ...manualItems.filter((item) => item.media.length > 0).map((item, index) => ({
      ...item,
      id: `manual-${item.slot}`,
      slot: videos.length + index + 1,
    })),
  ];
  return publicItems.length > 0 ? publicItems : manualItems;
}
