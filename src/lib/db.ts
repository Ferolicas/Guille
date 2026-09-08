import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/db/schema";

const globalForDb = globalThis as unknown as { guillePool?: Pool };

function createPool() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL no está configurada");
  return new Pool({ connectionString: process.env.DATABASE_URL, max: 5, connectionTimeoutMillis: 3000 });
}

export const pool = globalForDb.guillePool ?? createPool();
if (process.env.NODE_ENV !== "production") globalForDb.guillePool = pool;
export const db = drizzle(pool, { schema });
