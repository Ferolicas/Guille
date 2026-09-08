import { NextResponse, type NextRequest } from "next/server";
import { assertSameOrigin, resetPanelPassword, setPanelSessionCookie } from "@/lib/panel-auth";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const body = await request.json() as { token?: unknown; password?: unknown };
    if (typeof body.token !== "string" || typeof body.password !== "string") {
      return NextResponse.json({ ok: false, message: "El enlace o la contraseña no son válidos." }, { status: 400 });
    }
    await resetPanelPassword(body.token, body.password);
    const response = NextResponse.json({ ok: true });
    setPanelSessionCookie(response);
    return response;
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "No se pudo cambiar la contraseña." }, { status: 400 });
  }
}
