import { NextResponse, type NextRequest } from "next/server";
import { assertSameOrigin, changePanelPassword, requestHasPanelSession, setPanelSessionCookie } from "@/lib/panel-auth";

export async function POST(request: NextRequest) {
  if (!requestHasPanelSession(request)) return NextResponse.json({ ok: false, message: "La sesión ha caducado." }, { status: 401 });
  try {
    assertSameOrigin(request);
    const body = await request.json() as { currentPassword?: unknown; newPassword?: unknown };
    if (typeof body.currentPassword !== "string" || typeof body.newPassword !== "string") {
      return NextResponse.json({ ok: false, message: "Completa las dos contraseñas." }, { status: 400 });
    }
    await changePanelPassword(body.currentPassword, body.newPassword);
    const response = NextResponse.json({ ok: true, message: "Contraseña cambiada correctamente." });
    setPanelSessionCookie(response);
    return response;
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "No se pudo cambiar la contraseña." }, { status: 400 });
  }
}
