import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { NextResponse, type NextRequest } from "next/server";
import { storedFilePath } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(request: NextRequest, context: { params: Promise<{ name: string }> }) {
  const { name } = await context.params;
  if (!/^[a-f0-9-]{36}\.(?:webp|mp4)$/.test(name)) {
    return NextResponse.json({ message: "Archivo no encontrado." }, { status: 404 });
  }

  try {
    const path = storedFilePath("gallery", name);
    const metadata = await stat(path);
    const mimeType = name.endsWith(".mp4") ? "video/mp4" : "image/webp";
    const range = request.headers.get("range");
    if (range && mimeType === "video/mp4") {
      const match = /^bytes=(\d+)-(\d*)$/.exec(range);
      if (!match) return new Response(null, { status: 416 });
      const start = Number(match[1]);
      const end = match[2] ? Math.min(Number(match[2]), metadata.size - 1) : metadata.size - 1;
      if (start > end || start >= metadata.size) return new Response(null, { status: 416 });
      const stream = createReadStream(path, { start, end });
      return new Response(Readable.toWeb(stream) as ReadableStream, {
        status: 206,
        headers: {
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=31536000, immutable",
          "Content-Length": String(end - start + 1),
          "Content-Range": `bytes ${start}-${end}/${metadata.size}`,
          "Content-Type": mimeType,
        },
      });
    }

    const stream = createReadStream(path);
    return new Response(Readable.toWeb(stream) as ReadableStream, {
      headers: {
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": String(metadata.size),
        "Content-Type": mimeType,
      },
    });
  } catch {
    return NextResponse.json({ message: "Archivo no encontrado." }, { status: 404 });
  }
}
