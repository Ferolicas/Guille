import Busboy, { type FileInfo } from "busboy";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { createReadStream, createWriteStream } from "node:fs";
import { copyFile, mkdir, mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, extname, join, resolve } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createGzip } from "node:zlib";
import sharp from "sharp";

export const MAX_FILE_BYTES = 200 * 1024 * 1024;
export const MAX_LEAD_FILES = 3;
export const MAX_GALLERY_FILES = 2;
export const EMAIL_ATTACHMENT_BUDGET = 15 * 1024 * 1024;

const blockedExtensions = new Set([
  ".apk", ".app", ".bat", ".bin", ".cmd", ".com", ".cpl", ".dll", ".dmg",
  ".exe", ".hta", ".iso", ".jar", ".js", ".jse", ".msi", ".msp", ".php",
  ".ps1", ".py", ".scr", ".sh", ".vbs", ".vbe", ".wsf",
]);

export type UploadKind = "image" | "video" | "document";

export type IncomingUpload = {
  fieldName: string;
  originalName: string;
  mimeType: string;
  path: string;
  size: number;
};

export type StoredUpload = {
  id: string;
  originalName: string;
  storageName: string;
  mimeType: string;
  kind: UploadKind;
  size: number;
  absolutePath: string;
};

export type ParsedMultipart = {
  fields: Record<string, string>;
  files: IncomingUpload[];
  temporaryDirectory: string;
};

function cleanFileName(value: string) {
  const normalized = basename(value || "archivo")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._ -]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  return (normalized || "archivo").slice(0, 180);
}

function uploadKind(info: FileInfo): UploadKind {
  if (info.mimeType.startsWith("image/")) return "image";
  if (info.mimeType.startsWith("video/")) return "video";
  return "document";
}

function validateUpload(info: FileInfo, galleryOnly: boolean) {
  const extension = extname(info.filename).toLowerCase();
  const kind = uploadKind(info);
  if (blockedExtensions.has(extension)) {
    throw new Error("Ese tipo de archivo no se admite por seguridad.");
  }
  if (galleryOnly && kind === "document") {
    throw new Error("La galería admite únicamente fotos o vídeos.");
  }
}

export async function parseMultipartRequest(
  request: Request,
  options: { maxFiles: number; galleryOnly?: boolean; acceptedFields?: string[] },
): Promise<ParsedMultipart> {
  if (!request.body) throw new Error("La solicitud no contiene archivos.");
  const temporaryDirectory = await mkdtemp(join(tmpdir(), "guille-upload-"));
  const fields: Record<string, string> = {};
  const files: IncomingUpload[] = [];
  const writes: Promise<void>[] = [];
  let failure: Error | null = null;
  let receivedFiles = 0;

  try {
    await new Promise<void>((resolvePromise, rejectPromise) => {
      const parser = Busboy({
        headers: Object.fromEntries(request.headers.entries()),
        limits: {
          fileSize: MAX_FILE_BYTES,
          files: options.maxFiles,
          fields: 30,
          fieldSize: 20_000,
        },
      });

      parser.on("field", (name, value) => {
        fields[name] = value;
      });

      parser.on("file", (fieldName, stream, info) => {
        receivedFiles += 1;
        if (options.acceptedFields && !options.acceptedFields.includes(fieldName)) {
          stream.resume();
          return;
        }

        try {
          validateUpload(info, Boolean(options.galleryOnly));
        } catch (error) {
          failure = error instanceof Error ? error : new Error("Archivo no válido.");
          stream.resume();
          return;
        }

        const originalName = cleanFileName(info.filename);
        const temporaryPath = join(temporaryDirectory, `${randomUUID()}${extname(originalName).toLowerCase()}`);
        let size = 0;
        stream.on("data", (chunk: Buffer) => { size += chunk.length; });
        stream.on("limit", () => {
          failure = new Error(`Cada archivo puede pesar como máximo ${MAX_FILE_BYTES / 1024 / 1024} MB.`);
        });
        writes.push(
          pipeline(stream, createWriteStream(temporaryPath, { flags: "wx" })).then(() => {
            files.push({ fieldName, originalName, mimeType: info.mimeType, path: temporaryPath, size });
          }),
        );
      });

      parser.on("filesLimit", () => {
        failure = new Error(`Puedes subir un máximo de ${options.maxFiles} archivos.`);
      });
      parser.once("error", rejectPromise);
      parser.once("close", resolvePromise);
      Readable.from(request.body as unknown as AsyncIterable<Uint8Array>)
        .once("error", rejectPromise)
        .pipe(parser);
    });
    await Promise.all(writes);
    if (failure) throw failure;
    if (receivedFiles > options.maxFiles) throw new Error(`Puedes subir un máximo de ${options.maxFiles} archivos.`);
    return { fields, files, temporaryDirectory };
  } catch (error) {
    await rm(temporaryDirectory, { recursive: true, force: true });
    throw error;
  }
}

export async function discardParsedUpload(parsed: ParsedMultipart) {
  await rm(parsed.temporaryDirectory, { recursive: true, force: true });
}

export function storageRoot() {
  const fallback = process.env.NODE_ENV === "production" ? "/var/www/guille-data/uploads" : join(process.cwd(), ".data", "uploads");
  return resolve(/* turbopackIgnore: true */ process.env.UPLOAD_ROOT || fallback);
}

export function storageDirectory(scope: "leads" | "gallery", child?: string) {
  const root = storageRoot();
  const directory = resolve(root, scope, child || "");
  if (!directory.startsWith(`${root}/`)) throw new Error("Ruta de almacenamiento no válida.");
  return directory;
}

export async function attachmentData(files: StoredUpload[]) {
  const attachments: { filename: string; fileblob: string; mimetype: string }[] = [];
  let total = 0;
  for (const file of files) {
    if (total + file.size > EMAIL_ATTACHMENT_BUDGET) continue;
    const content = await readFile(file.absolutePath);
    attachments.push({
      filename: file.originalName,
      fileblob: content.toString("base64"),
      mimetype: file.mimeType,
    });
    total += file.size;
  }
  return { attachments, attachedCount: attachments.length, totalBytes: total };
}

function runFfmpeg(input: string, output: string, compact = false) {
  const width = compact ? 854 : 1280;
  const args = [
    "-loglevel", "error", "-y", "-i", input,
    "-vf", `scale=w='min(${width},iw)':h=-2`,
    "-c:v", "libx264", "-preset", "veryfast", "-crf", compact ? "34" : "30",
    "-maxrate", compact ? "550k" : "1400k", "-bufsize", compact ? "1100k" : "2800k",
    "-c:a", "aac", "-b:a", compact ? "64k" : "96k",
    "-movflags", "+faststart", output,
  ];
  return new Promise<void>((resolvePromise, rejectPromise) => {
    const child = spawn("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });
    let errorOutput = "";
    child.stderr.on("data", (chunk) => { errorOutput += chunk.toString().slice(0, 2000); });
    child.once("error", rejectPromise);
    child.once("close", (code) => {
      if (code === 0) resolvePromise();
      else rejectPromise(new Error(`No se pudo comprimir el vídeo. ${errorOutput.trim()}`));
    });
  });
}

function displayName(originalName: string, extension: string) {
  const base = originalName.slice(0, Math.max(1, 180 - extension.length)).replace(/\.[^.]+$/, "");
  return `${base}${extension}`;
}

export async function compressAndStore(
  upload: IncomingUpload,
  scope: "leads" | "gallery",
  child?: string,
): Promise<StoredUpload> {
  const id = randomUUID();
  const destination = storageDirectory(scope, child);
  await mkdir(destination, { recursive: true, mode: 0o750 });
  const kind = upload.mimeType.startsWith("image/")
    ? "image"
    : upload.mimeType.startsWith("video/")
      ? "video"
      : "document";

  if (kind === "image") {
    const storageName = `${id}.webp`;
    const absolutePath = join(/* turbopackIgnore: true */ destination, storageName);
    try {
      await sharp(upload.path)
        .rotate()
        .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 78, effort: 5 })
        .toFile(absolutePath);
    } catch (error) {
      await rm(absolutePath, { force: true }).catch(() => undefined);
      throw new Error("La foto no tiene un formato válido o está dañada.", { cause: error });
    }
    const metadata = await stat(absolutePath);
    return {
      id,
      originalName: displayName(upload.originalName, ".webp"),
      storageName,
      mimeType: "image/webp",
      kind,
      size: metadata.size,
      absolutePath,
    };
  }

  if (kind === "video") {
    const storageName = `${id}.mp4`;
    const absolutePath = join(/* turbopackIgnore: true */ destination, storageName);
    try {
      await runFfmpeg(upload.path, absolutePath);
      const firstPass = await stat(absolutePath);
      if (firstPass.size > 8 * 1024 * 1024) await runFfmpeg(upload.path, absolutePath, true);
    } catch (error) {
      await rm(absolutePath, { force: true }).catch(() => undefined);
      throw new Error("El vídeo no tiene un formato válido o no se pudo comprimir.", { cause: error });
    }
    const metadata = await stat(absolutePath);
    return {
      id,
      originalName: displayName(upload.originalName, ".mp4"),
      storageName,
      mimeType: "video/mp4",
      kind,
      size: metadata.size,
      absolutePath,
    };
  }

  const originalExtension = extname(upload.originalName).toLowerCase().slice(0, 12);
  const shouldCompress = upload.size > 2 * 1024 * 1024;
  const storageName = `${id}${originalExtension || ".file"}${shouldCompress ? ".gz" : ""}`;
  const absolutePath = join(/* turbopackIgnore: true */ destination, storageName);
  if (shouldCompress) {
    await pipeline(createReadStream(upload.path), createGzip({ level: 9 }), createWriteStream(absolutePath, { flags: "wx" }));
  } else {
    await copyFile(upload.path, absolutePath);
  }
  const metadata = await stat(/* turbopackIgnore: true */ absolutePath);
  return {
    id,
    originalName: `${upload.originalName}${shouldCompress ? ".gz" : ""}`,
    storageName,
    mimeType: shouldCompress ? "application/gzip" : upload.mimeType || "application/octet-stream",
    kind,
    size: metadata.size,
    absolutePath,
  };
}

export function storedFilePath(scope: "leads" | "gallery", storageName: string, child?: string) {
  if (basename(storageName) !== storageName) throw new Error("Nombre de archivo no válido.");
  return join(/* turbopackIgnore: true */ storageDirectory(scope, child), storageName);
}
