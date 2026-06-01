import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  AUTH_COOKIE,
  createSessionToken,
  verifyLoginCode,
} from "@/lib/auth";
import { getClientIp } from "@/lib/sanitize";

const schema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    const ip = getClientIp(req);
    const result = await verifyLoginCode(parsed.data.email, parsed.data.code, ip);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error ?? "Code incorrect ou expiré" },
        { status: result.error?.includes("Trop") ? 429 : 401 },
      );
    }

    const token = await createSessionToken(parsed.data.email);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
