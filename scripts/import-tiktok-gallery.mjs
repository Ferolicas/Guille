import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import pg from "pg";

const { Pool } = pg;
const manifestPath = process.argv[2];
if (!manifestPath) throw new Error("Uso: pnpm gallery:import /ruta/al/manifest.json");

try {
  process.loadEnvFile?.(".env");
} catch {
  // Producción también puede inyectar las variables mediante PM2.
}

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL no está configurada.");
const uploadRoot = resolve(process.env.UPLOAD_ROOT || "/var/www/guille-data/uploads");
const galleryDirectory = resolve(uploadRoot, "gallery");
const entries = JSON.parse(await readFile(resolve(manifestPath), "utf8"));
if (!Array.isArray(entries) || entries.length === 0) throw new Error("El manifiesto no contiene vídeos.");

for (const entry of entries) {
  if (!/^[a-f0-9-]{36}$/.test(entry.id || "")) throw new Error(`ID inválido: ${entry.id}`);
  if (!/^[a-f0-9-]{36}\.mp4$/.test(entry.storageName || "")) throw new Error(`Vídeo inválido: ${entry.storageName}`);
  if (!/^[a-f0-9-]{36}\.webp$/.test(entry.posterName || "")) throw new Error(`Portada inválida: ${entry.posterName}`);
  await access(resolve(galleryDirectory, entry.storageName));
  await access(resolve(galleryDirectory, entry.posterName));
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
try {
  await client.query("BEGIN");
  for (const entry of entries) {
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
        entry.id,
        String(entry.title || "Trabajo real").slice(0, 120),
        String(entry.description || "").slice(0, 1200),
        entry.storageName,
        entry.posterName,
        String(entry.sourceExternalId),
        String(entry.sourceUrl),
        Number(entry.sortOrder) || 0,
        new Date(entry.publishedAt),
      ],
    );
  }
  await client.query("COMMIT");
  console.log(`${entries.length} vídeos importados.`);
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
