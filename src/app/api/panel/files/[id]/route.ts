import { eq } from "drizzle-orm";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { NextResponse, type NextRequest } from "next/server";
import { leadFiles } from "@/db/schema";
import { db } from "@/lib/db";
import { requestHasPanelSession } from "@/lib/panel-auth";
import { storedFilePath } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!requestHasPanelSession(request)) return NextResponse.json({ message: "La sesión ha caducado." }, { status: 401 });
  const { id } = await context.params;
  const [file] = await db.select().from(leadFiles).where(eq(leadFiles.id, id)).limit(1);
  if (!file) return NextResponse.json({ message: "Archivo no encontrado." }, { status: 404 });

  try {
    const path = storedFilePath("leads", file.storageName, file.leadId);
    const metadata = await stat(path);
    const safeName = file.originalName.replace(/["\r\n]/g, "-");
    const inline = file.mimeType === "image/webp" || file.mimeType === "video/mp4" || file.mimeType === "application/pdf";
    const responseType = inline ? file.mimeType : "application/octet-stream";
    const range = request.headers.get("range");
    if (range && file.mimeType === "video/mp4") {
      const match = /^bytes=(\d+)-(\d*)$/.exec(range);
      if (!match) return new Response(null, { status: 416 });
      const start = Number(match[1]);
      const end = match[2] ? Math.min(Number(match[2]), metadata.size - 1) : metadata.size - 1;
      if (start > end || start >= metadata.size) return new Response(null, { status: 416 });
      return new Response(Readable.toWeb(createReadStream(path, { start, end })) as ReadableStream, {
        status: 206,
        headers: {
          "Accept-Ranges": "bytes",
          "Cache-Control": "private, no-store",
          "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${safeName}"`,
          "Content-Length": String(end - start + 1),
          "Content-Range": `bytes ${start}-${end}/${metadata.size}`,
          "Content-Security-Policy": "sandbox",
          "Content-Type": responseType,
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    return new Response(Readable.toWeb(createReadStream(path)) as ReadableStream, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${safeName}"`,
        "Content-Length": String(metadata.size),
        "Content-Security-Policy": "sandbox",
        "Content-Type": responseType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ message: "Archivo no encontrado." }, { status: 404 });
  }
}
