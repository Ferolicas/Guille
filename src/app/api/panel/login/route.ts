import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { assertSameOrigin, authenticatePanel, setPanelSessionCookie } from "@/lib/panel-auth";

export const runtime = "nodejs";

const attempts = new Map<string, number[]>();

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const key = createHash("sha256").update(`${process.env.AUTH_SECRET || "guille"}:${ip}`).digest("hex");
    const now = Date.now();
    const active = (attempts.get(key) || []).filter((time) => now - time < 15 * 60 * 1000);
    if (active.length >= 8) return NextResponse.json({ ok: false, message: "Demasiados intentos. Espera 15 minutos." }, { status: 429 });

    const body = await request.json() as { password?: unknown };
    const password = typeof body.password === "string" ? body.password : "";
    if (!password || !(await authenticatePanel(password))) {
      active.push(now);
      attempts.set(key, active);
      return NextResponse.json({ ok: false, message: "La contraseña no es correcta." }, { status: 401 });
    }

    attempts.delete(key);
    const response = NextResponse.json({ ok: true });
    setPanelSessionCookie(response);
    return response;
  } catch (error) {
    console.error("Fallo al iniciar sesión en el panel", error);
    return NextResponse.json({ ok: false, message: "No pudimos iniciar sesión ahora mismo." }, { status: 500 });
  }
}
