import { NextResponse, type NextRequest } from "next/server";
import { passwordResetEmail, sendTransactionalEmail } from "@/lib/email";
import { assertSameOrigin, createPasswordReset } from "@/lib/panel-auth";

const attempts = new Map<string, number>();

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const lastAttempt = attempts.get(ip) || 0;
    if (Date.now() - lastAttempt < 60_000) {
      return NextResponse.json({ ok: true, message: "Si el correo coincide, recibirás un enlace en unos minutos." });
    }
    attempts.set(ip, Date.now());

    const body = await request.json() as { email?: unknown };
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const token = email ? await createPasswordReset(email) : null;
    if (token) {
      const appUrl = (process.env.APP_URL || "https://guilloguambi.com").replace(/\/$/, "");
      const resetUrl = `${appUrl}/panel/restablecer?token=${encodeURIComponent(token)}`;
      const message = passwordResetEmail(resetUrl);
      await sendTransactionalEmail({ to: email, ...message });
    }
    return NextResponse.json({ ok: true, message: "Si el correo coincide, recibirás un enlace en unos minutos." });
  } catch (error) {
    console.error("No se pudo iniciar la recuperación", error);
    return NextResponse.json({ ok: false, message: "No pudimos enviar el enlace. Revisa la configuración de correo." }, { status: 500 });
  }
}
