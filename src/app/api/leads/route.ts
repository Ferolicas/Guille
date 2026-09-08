import { createHash, randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { NextResponse, type NextRequest } from "next/server";
import { leadFiles, leads } from "@/db/schema";
import { db } from "@/lib/db";
import { sendLeadEmails } from "@/lib/email";
import { leadSchema } from "@/lib/lead-schema";
import {
  compressAndStore,
  discardParsedUpload,
  MAX_LEAD_FILES,
  parseMultipartRequest,
  storageDirectory,
  type ParsedMultipart,
  type StoredUpload,
} from "@/lib/storage";

export const runtime = "nodejs";

const attempts = new Map<string, number[]>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function clientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function limitReached(key: string) {
  const now = Date.now();
  const active = (attempts.get(key) ?? []).filter((time) => now - time < WINDOW_MS);
  if (active.length >= MAX_ATTEMPTS) return true;
  active.push(now);
  attempts.set(key, active);
  if (attempts.size > 5000) attempts.clear();
  return false;
}

async function requestContent(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const parsedUpload = await parseMultipartRequest(request, {
      maxFiles: MAX_LEAD_FILES,
      acceptedFields: ["files"],
    });
    return { body: parsedUpload.fields as Record<string, unknown>, parsedUpload };
  }
  return { body: await request.json() as Record<string, unknown>, parsedUpload: null };
}

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const ipHash = createHash("sha256").update(`${process.env.AUTH_SECRET ?? "guille"}:${ip}`).digest("hex");
  if (limitReached(ipHash)) {
    return NextResponse.json({ ok: false, message: "Has enviado varias solicitudes. Espera unos minutos." }, { status: 429 });
  }

  let parsedUpload: ParsedMultipart | null = null;
  let leadDirectory: string | null = null;
  try {
    const content = await requestContent(request);
    parsedUpload = content.parsedUpload;
    const parsed = leadSchema.safeParse({
      ...content.body,
      startedAt: Number(content.body.startedAt),
      consent: content.body.consent === "true" || content.body.consent === true,
    });
    if (!parsed.success) {
      return NextResponse.json({ ok: false, message: parsed.error.issues[0]?.message || "Revisa los datos." }, { status: 400 });
    }
    if (Date.now() - parsed.data.startedAt < 1500) {
      return NextResponse.json({ ok: false, message: "No pudimos validar el envío. Inténtalo de nuevo." }, { status: 400 });
    }

    const lead = parsed.data;
    const leadId = randomUUID();
    const storedFiles: StoredUpload[] = [];
    if (parsedUpload?.files.length) {
      leadDirectory = storageDirectory("leads", leadId);
      for (const file of parsedUpload.files) {
        storedFiles.push(await compressAndStore(file, "leads", leadId));
      }
    }

    await db.transaction(async (transaction) => {
      await transaction.insert(leads).values({
        id: leadId,
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        city: lead.city,
        service: lead.service,
        message: lead.message,
        consent: lead.consent,
        source: lead.source,
        ipHash,
        userAgent: request.headers.get("user-agent")?.slice(0, 1000) ?? null,
      });
      if (storedFiles.length) {
        await transaction.insert(leadFiles).values(storedFiles.map((file) => ({
          id: file.id,
          leadId,
          originalName: file.originalName,
          storageName: file.storageName,
          mimeType: file.mimeType,
          kind: file.kind,
          size: file.size,
        })));
      }
    });

    const mail = await sendLeadEmails({
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      city: lead.city,
      service: lead.service,
      message: lead.message,
    }, storedFiles);

    return NextResponse.json({
      ok: true,
      message: mail.clientSent
        ? "Solicitud recibida. Revisa tu correo: te hemos enviado la confirmación."
        : "Solicitud recibida. Te contactaremos lo antes posible.",
    }, { status: 201 });
  } catch (error) {
    if (leadDirectory) await rm(leadDirectory, { recursive: true, force: true }).catch(() => undefined);
    console.error("No se pudo procesar la solicitud", error);
    const message = error instanceof Error && /archivo|vídeo|foto|MB|galería/i.test(error.message)
      ? error.message
      : "No pudimos guardar la solicitud. Inténtalo de nuevo o escríbenos por WhatsApp.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  } finally {
    if (parsedUpload) await discardParsedUpload(parsedUpload).catch(() => undefined);
  }
}
