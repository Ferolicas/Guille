import { NextResponse, type NextRequest } from "next/server";
import { assertSameOrigin, clearPanelSessionCookie } from "@/lib/panel-auth";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const response = NextResponse.json({ ok: true });
    clearPanelSessionCookie(response);
    return response;
  } catch {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
}
