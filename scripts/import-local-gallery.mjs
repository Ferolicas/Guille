import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import pg from "pg";

const { Pool } = pg;
const manifestPath = process.argv[2];
if (!manifestPath) throw new Error("Uso: pnpm gallery:import-local /ruta/al/manifest.json");

try {
  process.loadEnvFile?.(".env");
} catch {
  // Producción también puede inyectar las variables mediante PM2.
}

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL no está configurada.");
const uploadRoot = resolve(process.env.UPLOAD_ROOT || "/var/www/guille-data/uploads");
const galleryDirectory = resolve(uploadRoot, "gallery");
const manifest = JSON.parse(await readFile(resolve(manifestPath), "utf8"));
const photos = Array.isArray(manifest.photos) ? manifest.photos : [];
const videos = Array.isArray(manifest.videos) ? manifest.videos : [];
if (photos.length === 0 && videos.length === 0) throw new Error("El manifiesto no contiene fotos ni vídeos.");

for (const photo of photos) {
  if (!/^[a-f0-9-]{36}$/.test(photo.id || "")) throw new Error(`ID de foto inválido: ${photo.id}`);
  if (!/^[a-f0-9-]{36}\.webp$/.test(photo.storageName || "")) throw new Error(`Foto inválida: ${photo.storageName}`);
  await access(resolve(galleryDirectory, photo.storageName));
}

for (const video of videos) {
  if (!/^[a-f0-9-]{36}$/.test(video.id || "")) throw new Error(`ID de vídeo inválido: ${video.id}`);
  if (!/^[a-f0-9-]{36}\.mp4$/.test(video.storageName || "")) throw new Error(`Vídeo inválido: ${video.storageName}`);
  if (!/^[a-f0-9-]{36}\.webp$/.test(video.posterName || "")) throw new Error(`Portada inválida: ${video.posterName}`);
  await access(resolve(galleryDirectory, video.storageName));
  await access(resolve(galleryDirectory, video.posterName));
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
try {
  await client.query("BEGIN");
  for (const photo of photos) {
    await client.query(
      `INSERT INTO gallery_photos
        (id, title, description, storage_name, source_external_id, sort_order, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (source_external_id) DO UPDATE SET
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         storage_name = EXCLUDED.storage_name,
         sort_order = EXCLUDED.sort_order`,
      [
        photo.id,
        String(photo.title || "Trabajo realizado").slice(0, 120),
        String(photo.description || "").slice(0, 1200),
        photo.storageName,
        String(photo.sourceExternalId).slice(0, 100),
        Number(photo.sortOrder) || 0,
        new Date(photo.createdAt || Date.now()),
      ],
    );
  }

  for (const video of videos) {
    await client.query(
      `INSERT INTO gallery_videos
        (id, title, description, storage_name, poster_name, source_external_id, source_url, sort_order, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (source_external_id) DO UPDATE SET
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         storage_name = EXCLUDED.storage_name,
         poster_name = EXCLUDED.poster_name,
         source_url = EXCLUDED.source_url,
         sort_order = EXCLUDED.sort_order`,
      [
        video.id,
        String(video.title || "Trabajo en vídeo").slice(0, 120),
        String(video.description || "").slice(0, 1200),
        video.storageName,
        video.posterName,
        String(video.sourceExternalId).slice(0, 100),
        String(video.sourceUrl || ""),
        Number(video.sortOrder) || 0,
        new Date(video.createdAt || Date.now()),
      ],
    );
  }
  await client.query("COMMIT");
  console.log(`${photos.length} fotos y ${videos.length} vídeos importados.`);
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
