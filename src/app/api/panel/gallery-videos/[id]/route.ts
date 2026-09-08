import { eq } from "drizzle-orm";
import { rm } from "node:fs/promises";
import { NextResponse, type NextRequest } from "next/server";
import { galleryVideos } from "@/db/schema";
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
      return NextResponse.json({ ok: false, message: "El vídeo no es válido." }, { status: 400 });
    }

    const [video] = await db.select().from(galleryVideos).where(eq(galleryVideos.id, id)).limit(1);
    if (!video) return NextResponse.json({ ok: false, message: "El vídeo ya no existe." }, { status: 404 });

    await db.delete(galleryVideos).where(eq(galleryVideos.id, id));
    await Promise.all([video.storageName, video.posterName].map((name) =>
      rm(storedFilePath("gallery", name), { force: true }).catch((error) => {
        console.error("No se pudo retirar un archivo del vídeo eliminado", error);
      }),
    ));

    return NextResponse.json({ ok: true, message: "Vídeo eliminado de la galería." });
  } catch (error) {
    console.error("No se pudo eliminar el vídeo importado", error);
    return NextResponse.json({ ok: false, message: "No se pudo eliminar el vídeo." }, { status: 400 });
  }
}
