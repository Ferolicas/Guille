import { eq } from "drizzle-orm";
import { rm } from "node:fs/promises";
import { NextResponse, type NextRequest } from "next/server";
import { galleryPhotos } from "@/db/schema";
import { db } from "@/lib/db";
import { assertSameOrigin, requestHasPanelSession } from "@/lib/panel-auth";
import { storedFilePath } from "@/lib/storage";

export const runtime = "nodejs";

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!requestHasPanelSession(request)) {
    return NextResponse.json({ ok: false, message: "La sesión ha caducado." }, { status: 401 });
  }

  try {
    assertSameOrigin(request);
    const { id } = await context.params;
    if (!/^[a-f0-9-]{36}$/.test(id)) {
      return NextResponse.json({ ok: false, message: "La foto no es válida." }, { status: 400 });
    }

    const [photo] = await db.select().from(galleryPhotos).where(eq(galleryPhotos.id, id)).limit(1);
    if (!photo) return NextResponse.json({ ok: false, message: "La foto ya no existe." }, { status: 404 });

    await db.delete(galleryPhotos).where(eq(galleryPhotos.id, id));
    await rm(storedFilePath("gallery", photo.storageName), { force: true }).catch((error) => {
      console.error("No se pudo retirar el archivo de la foto eliminada", error);
    });

    return NextResponse.json({ ok: true, message: "Foto eliminada de la galería." });
  } catch (error) {
    console.error("No se pudo eliminar la foto importada", error);
    return NextResponse.json({ ok: false, message: "No se pudo eliminar la foto." }, { status: 400 });
  }
}
