import { createHash, randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { Resend } from "resend";
import { db } from "@/lib/db";
import { leads } from "@/db/schema";
import { leadSchema } from "@/lib/lead-schema";

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

function escapeHtml(value: string) {
  const replacements: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  };
  return value.replace(/[&<>'"]/g, (char) => replacements[char] ?? char);
}

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const ipHash = createHash("sha256").update(`${process.env.AUTH_SECRET ?? "guille"}:${ip}`).digest("hex");
  if (limitReached(ipHash)) {
    return NextResponse.json({ ok: false, message: "Has enviado varias solicitudes. Espera unos minutos." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "La solicitud no tiene un formato válido." }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: parsed.error.issues[0]?.message || "Revisa los datos." }, { status: 400 });
  }

  if (Date.now() - parsed.data.startedAt < 1500) {
    return NextResponse.json({ ok: false, message: "No pudimos validar el envío. Inténtalo de nuevo." }, { status: 400 });
  }

  const lead = parsed.data;
  await db.insert(leads).values({
    id: randomUUID(),
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

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL;
  if (apiKey && to && from) {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: lead.email ?? undefined,
      subject: `Nueva solicitud: ${lead.service}`,
      html: `<h2>Nueva solicitud desde guilloguambi.com</h2><p><strong>Nombre:</strong> ${escapeHtml(lead.name)}</p><p><strong>Teléfono:</strong> ${escapeHtml(lead.phone)}</p><p><strong>Email:</strong> ${escapeHtml(lead.email ?? "—")}</p><p><strong>Municipio:</strong> ${escapeHtml(lead.city ?? "—")}</p><p><strong>Servicio:</strong> ${escapeHtml(lead.service)}</p><p><strong>Proyecto:</strong><br>${escapeHtml(lead.message).replace(/\n/g, "<br>")}</p>`,
    });
    if (error) console.error("No se pudo enviar la notificación del lead", error.name);
  }

  return NextResponse.json({ ok: true, message: "Solicitud recibida. Te contactaremos lo antes posible." }, { status: 201 });
}
