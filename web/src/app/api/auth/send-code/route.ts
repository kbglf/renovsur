import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createLoginCode } from "@/lib/auth";
import { getClientIp } from "@/lib/sanitize";
import { sendLoginCodeEmail } from "@/lib/email";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    const result = await createLoginCode(parsed.data.email, ip);
    if (!result.ok || !result.code) {
      return NextResponse.json({ error: result.error }, { status: 429 });
    }

    const sent = await sendLoginCodeEmail({
      to: parsed.data.email,
      code: result.code,
    });

    if (!sent.sent && process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        { error: "Impossible d'envoyer l'email. Réessayez." },
        { status: 503 },
      );
    }

    const payload: { ok: boolean; message: string; devCode?: string } = {
      ok: true,
      message: sent.sent
        ? "Code envoyé par email"
        : "Mode dev : utilisez le code affiché",
    };

    if (process.env.NODE_ENV === "development") {
      payload.devCode = result.code;
    }

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
