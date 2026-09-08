import { eq } from "drizzle-orm";
import { rm } from "node:fs/promises";
import { NextResponse, type NextRequest } from "next/server";
import { gallerySlots } from "@/db/schema";
import { db } from "@/lib/db";
import { assertSameOrigin, requestHasPanelSession } from "@/lib/panel-auth";
import {
  compressAndStore,
  discardParsedUpload,
  MAX_GALLERY_FILES,
  parseMultipartRequest,
  storedFilePath,
  type ParsedMultipart,
  type StoredUpload,
} from "@/lib/storage";

export const runtime = "nodejs";

type SlotMedia = { name: string; type: "image" | "video"; label: "before" | "after" | "single" };

function publicMedia(item: SlotMedia) {
  return { src: `/api/gallery-media/${encodeURIComponent(item.name)}`, type: item.type, label: item.label };
}

export async function POST(request: NextRequest, context: { params: Promise<{ slot: string }> }) {
  if (!requestHasPanelSession(request)) return NextResponse.json({ ok: false, message: "La sesión ha caducado." }, { status: 401 });
  let parsed: ParsedMultipart | null = null;
  const created: StoredUpload[] = [];
  try {
    assertSameOrigin(request);
    const slot = Number((await context.params).slot);
    if (!Number.isInteger(slot) || slot < 1 || slot > 6) {
      return NextResponse.json({ ok: false, message: "La tarjeta no es válida." }, { status: 400 });
    }

    parsed = await parseMultipartRequest(request, {
      maxFiles: MAX_GALLERY_FILES,
      galleryOnly: true,
      acceptedFields: ["mediaOne", "mediaTwo"],
    });
    const [current] = await db.select().from(gallerySlots).where(eq(gallerySlots.slot, slot)).limit(1);
    const media: Array<SlotMedia | null> = [
      current?.mediaOneName && (current.mediaOneType === "image" || current.mediaOneType === "video")
        ? { name: current.mediaOneName, type: current.mediaOneType, label: current.mediaOneLabel === "after" ? "after" : current.mediaOneLabel === "before" ? "before" : "single" }
        : null,
      current?.mediaTwoName && (current.mediaTwoType === "image" || current.mediaTwoType === "video")
        ? { name: current.mediaTwoName, type: current.mediaTwoType, label: current.mediaTwoLabel === "before" ? "before" : "after" }
        : null,
    ];

    if (parsed.fields.removeOne === "true") media[0] = null;
    if (parsed.fields.removeTwo === "true") media[1] = null;
    for (const incoming of parsed.files) {
      const stored = await compressAndStore(incoming, "gallery");
      created.push(stored);
      const index = incoming.fieldName === "mediaTwo" ? 1 : 0;
      media[index] = { name: stored.storageName, type: stored.kind === "video" ? "video" : "image", label: "single" };
    }

    const normalized = media.filter((item): item is SlotMedia => Boolean(item)).slice(0, 2);
    if (normalized.length === 1) normalized[0].label = "single";
    if (normalized.length === 2) {
      const requestedOne = parsed.fields.labelOne === "after" ? "after" : "before";
      const requestedTwo = parsed.fields.labelTwo === "before" ? "before" : "after";
      normalized[0].label = requestedOne;
      normalized[1].label = requestedTwo === requestedOne ? (requestedOne === "before" ? "after" : "before") : requestedTwo;
    }

    const title = (parsed.fields.title || "").trim().slice(0, 120);
    const description = (parsed.fields.description || "").trim().slice(0, 1000);
    await db.insert(gallerySlots).values({
      slot,
      title,
      description,
      mediaOneName: normalized[0]?.name ?? null,
      mediaOneType: normalized[0]?.type ?? null,
      mediaOneLabel: normalized[0]?.label ?? null,
      mediaTwoName: normalized[1]?.name ?? null,
      mediaTwoType: normalized[1]?.type ?? null,
      mediaTwoLabel: normalized[1]?.label ?? null,
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: gallerySlots.slot,
      set: {
        title,
        description,
        mediaOneName: normalized[0]?.name ?? null,
        mediaOneType: normalized[0]?.type ?? null,
        mediaOneLabel: normalized[0]?.label ?? null,
        mediaTwoName: normalized[1]?.name ?? null,
        mediaTwoType: normalized[1]?.type ?? null,
        mediaTwoLabel: normalized[1]?.label ?? null,
        updatedAt: new Date(),
      },
    });

    const oldNames = [current?.mediaOneName, current?.mediaTwoName].filter((name): name is string => Boolean(name));
    const retainedNames = new Set(normalized.map((item) => item.name));
    await Promise.all(oldNames.filter((name) => !retainedNames.has(name)).map((name) => rm(storedFilePath("gallery", name), { force: true }).catch((error) => {
      console.error("No se pudo retirar un archivo anterior de la galería", error);
    })));

    return NextResponse.json({
      ok: true,
      item: { slot, title, description, media: normalized.map(publicMedia) },
      message: `Tarjeta ${slot} actualizada.`,
    });
  } catch (error) {
    await Promise.all(created.map((file) => rm(file.absolutePath, { force: true }).catch(() => undefined)));
    console.error("No se pudo guardar la tarjeta de galería", error);
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "No se pudo guardar la tarjeta." }, { status: 400 });
  } finally {
    if (parsed) await discardParsedUpload(parsed).catch(() => undefined);
  }
}
