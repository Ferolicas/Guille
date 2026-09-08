import { createHash, createHmac, randomBytes, timingSafeEqual, scryptSync } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import type { NextRequest, NextResponse } from "next/server";
import { adminCredentials, passwordResetTokens } from "@/db/schema";
import { db } from "@/lib/db";

export const PANEL_COOKIE = "guille_panel_session";
const SESSION_SECONDS = 12 * 60 * 60;
const RESET_MINUTES = 30;
const ADMIN_ID = "owner";
const DEFAULT_PASSWORD_HASH = "scrypt$16384$8$1$l2h8A-NzyG2KXwlziVbZUQ$SX83CYlYT2TXeb2SsgywafcNdWNSJ2YfgFHXwyfhnmiLLe5ezik7aY9Ng9bm0KE-KA0he4talBT29Kr3XT2Ang";

function configuredRecoveryEmail() {
  return (process.env.PANEL_RECOVERY_EMAIL || "guilloguambi@gmail.com").trim().toLowerCase();
}

function secret() {
  const value = process.env.AUTH_SECRET?.trim();
  if (value) return value;
  if (process.env.NODE_ENV !== "production") return "guille-local-development-secret-change-me";
  throw new Error("AUTH_SECRET no está configurada.");
}

function encode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function createPanelSession() {
  const payload = encode(JSON.stringify({ sub: ADMIN_ID, exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS }));
  return `${payload}.${sign(payload)}`;
}

export function validPanelSession(value: string | undefined) {
  if (!value) return false;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return false;
  const expected = Buffer.from(sign(payload));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return false;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { sub?: string; exp?: number };
    return parsed.sub === ADMIN_ID && typeof parsed.exp === "number" && parsed.exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

export function requestHasPanelSession(request: NextRequest) {
  return validPanelSession(request.cookies.get(PANEL_COOKIE)?.value);
}

export function setPanelSessionCookie(response: NextResponse, value = createPanelSession()) {
  response.cookies.set(PANEL_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export function clearPanelSessionCookie(response: NextResponse) {
  response.cookies.set(PANEL_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

export function assertSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return;
  const originHost = new URL(origin).host;
  if (originHost !== host) throw new Error("Origen de la solicitud no válido.");
}

function hashPassword(password: string, salt = randomBytes(16)) {
  const cost = 16384;
  const blockSize = 8;
  const parallelization = 1;
  const derived = scryptSync(password, salt, 64, { N: cost, r: blockSize, p: parallelization });
  return `scrypt$${cost}$${blockSize}$${parallelization}$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

function verifyPassword(password: string, stored: string) {
  const [algorithm, costValue, blockValue, parallelValue, saltValue, hashValue] = stored.split("$");
  if (algorithm !== "scrypt" || !costValue || !blockValue || !parallelValue || !saltValue || !hashValue) return false;
  const expected = Buffer.from(hashValue, "base64url");
  const actual = scryptSync(password, Buffer.from(saltValue, "base64url"), expected.length, {
    N: Number(costValue),
    r: Number(blockValue),
    p: Number(parallelValue),
  });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

async function adminCredential() {
  await db.insert(adminCredentials).values({
    id: ADMIN_ID,
    passwordHash: DEFAULT_PASSWORD_HASH,
    recoveryEmail: configuredRecoveryEmail(),
  }).onConflictDoNothing();
  const [credential] = await db.select().from(adminCredentials).where(eq(adminCredentials.id, ADMIN_ID)).limit(1);
  if (!credential) throw new Error("No se pudo inicializar el acceso al panel.");
  return credential;
}

export async function authenticatePanel(password: string) {
  const credential = await adminCredential();
  return verifyPassword(password, credential.passwordHash);
}

export function validateNewPassword(password: string) {
  return password.length >= 10
    && /[a-z]/.test(password)
    && /[A-Z]/.test(password)
    && /\d/.test(password)
    && /[^A-Za-z0-9]/.test(password);
}

export async function changePanelPassword(currentPassword: string, newPassword: string) {
  if (!validateNewPassword(newPassword)) throw new Error("Usa al menos 10 caracteres, mayúscula, minúscula, número y símbolo.");
  const credential = await adminCredential();
  if (!verifyPassword(currentPassword, credential.passwordHash)) throw new Error("La contraseña actual no es correcta.");
  await db.update(adminCredentials)
    .set({ passwordHash: hashPassword(newPassword), updatedAt: new Date() })
    .where(eq(adminCredentials.id, ADMIN_ID));
}

export async function createPasswordReset(email: string) {
  const credential = await adminCredential();
  const normalized = email.trim().toLowerCase();
  if (normalized !== credential.recoveryEmail.toLowerCase()) return null;
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  await db.insert(passwordResetTokens).values({
    id: randomBytes(18).toString("hex"),
    tokenHash,
    expiresAt: new Date(Date.now() + RESET_MINUTES * 60 * 1000),
  });
  return token;
}

export async function resetPanelPassword(token: string, newPassword: string) {
  if (!validateNewPassword(newPassword)) throw new Error("Usa al menos 10 caracteres, mayúscula, minúscula, número y símbolo.");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const [stored] = await db.select().from(passwordResetTokens).where(and(
    eq(passwordResetTokens.tokenHash, tokenHash),
    isNull(passwordResetTokens.usedAt),
    gt(passwordResetTokens.expiresAt, new Date()),
  )).limit(1);
  if (!stored) throw new Error("El enlace ha caducado o ya fue utilizado.");

  await db.transaction(async (transaction) => {
    await transaction.update(adminCredentials)
      .set({ passwordHash: hashPassword(newPassword), updatedAt: new Date() })
      .where(eq(adminCredentials.id, ADMIN_ID));
    await transaction.update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, stored.id));
  });
}
