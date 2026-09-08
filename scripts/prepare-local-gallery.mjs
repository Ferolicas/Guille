import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import process from "node:process";
import sharp from "sharp";

const sourceDirectory = resolve(process.argv[2] || "");
const outputDirectory = resolve(process.argv[3] || "");
if (!process.argv[2] || !process.argv[3]) {
  throw new Error("Uso: pnpm gallery:prepare /carpeta/origen /carpeta/salida");
}

function run(command, args) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, { stdio: ["ignore", "ignore", "pipe"] });
    let output = "";
    child.stderr.on("data", (chunk) => { output += chunk.toString().slice(0, 3000); });
    child.once("error", rejectPromise);
    child.once("close", (code) => code === 0 ? resolvePromise() : rejectPromise(new Error(`${command} terminó con código ${code}. ${output.trim()}`)));
  });
}

await mkdir(outputDirectory, { recursive: true });
const names = await readdir(sourceDirectory);
const numberedPhotos = names.flatMap((name) => {
  const match = /^(\d+)(?:\+(\d+))?\.jpe?g$/i.exec(name);
  if (!match) return [];
  return [{ name, number: Number(match[2] || match[1]) }];
}).sort((a, b) => a.number - b.number);

const photoNumbers = new Set(numberedPhotos.map((photo) => photo.number));
if (photoNumbers.size !== numberedPhotos.length) throw new Error("Hay números de foto duplicados.");

const photos = [];
for (const photo of numberedPhotos) {
  const id = randomUUID();
  const storageName = `${id}.webp`;
  await sharp(join(sourceDirectory, photo.name))
    .rotate()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80, effort: 5 })
    .toFile(join(outputDirectory, storageName));
  photos.push({
    id,
    title: "Trabajo realizado",
    description: "Una muestra real del trabajo realizado por Guillo Guambi.",
    storageName,
    sourceExternalId: `guillo-photo-${photo.number}`,
    sortOrder: photo.number,
    createdAt: new Date().toISOString(),
  });
}

const videoNames = names.filter((name) => /^\d+\.mp4$/i.test(name)).sort((a, b) => Number.parseInt(a) - Number.parseInt(b));
const videos = [];
for (const [index, name] of videoNames.entries()) {
  const id = randomUUID();
  const posterId = randomUUID();
  const storageName = `${id}.mp4`;
  const posterName = `${posterId}.webp`;
  const sourcePath = join(sourceDirectory, name);
  const outputPath = join(outputDirectory, storageName);
  await run("ffmpeg", [
    "-loglevel", "error", "-y", "-i", sourcePath,
    "-vf", "scale=w='min(1280,iw)':h=-2",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "30",
    "-maxrate", "1400k", "-bufsize", "2800k",
    "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", outputPath,
  ]);
  if ((await stat(outputPath)).size > 8 * 1024 * 1024) {
    await run("ffmpeg", [
      "-loglevel", "error", "-y", "-i", sourcePath,
      "-vf", "scale=w='min(854,iw)':h=-2",
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "34",
      "-maxrate", "550k", "-bufsize", "1100k",
      "-c:a", "aac", "-b:a", "64k", "-movflags", "+faststart", outputPath,
    ]);
  }
  await run("ffmpeg", [
    "-loglevel", "error", "-y", "-ss", "1", "-i", sourcePath,
    "-frames:v", "1", "-vf", "scale=w='min(960,iw)':h=-2", "-c:v", "libwebp", "-quality", "80",
    join(outputDirectory, posterName),
  ]);
  videos.push({
    id,
    title: "Trabajo en vídeo",
    description: "Proceso y resultado de un trabajo realizado por Guillo Guambi.",
    storageName,
    posterName,
    sourceExternalId: `guillo-video-${Number.parseInt(name)}`,
    sourceUrl: "",
    sortOrder: -1000 + index,
    createdAt: new Date().toISOString(),
  });
}

const manifest = { photos, videos };
await writeFile(join(outputDirectory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`${photos.length} fotos y ${videos.length} vídeos preparados en ${outputDirectory}.`);
