import { NextResponse } from "next/server";
import { getLegalField } from "@/lib/env";

function configured(key: string | undefined): boolean {
  return Boolean(key?.trim());
}

export async function GET() {
  const stripe = configured(process.env.STRIPE_SECRET_KEY);
  const webhook = configured(process.env.STRIPE_WEBHOOK_SECRET);
  const resend = configured(process.env.RESEND_API_KEY);
  const auth = configured(process.env.AUTH_SECRET) && (process.env.AUTH_SECRET?.length ?? 0) >= 32;
  const blob = configured(process.env.BLOB_READ_WRITE_TOKEN);
  const appUrl = configured(process.env.NEXT_PUBLIC_APP_URL);
  const openai = configured(process.env.OPENAI_API_KEY);
  const legal =
    Boolean(getLegalField("company")) &&
    Boolean(getLegalField("siret")) &&
    Boolean(getLegalField("address")) &&
    Boolean(getLegalField("director"));

  const paymentsReady = stripe && webhook;
  const emailsReady = resend;
  const launchReady = paymentsReady && emailsReady && auth && blob && appUrl && legal;

  return NextResponse.json({
    status: "ok",
    service: "renovsur",
    storage: blob ? "vercel-blob" : "local",
    timestamp: new Date().toISOString(),
    readiness: {
      launchReady,
      paymentsReady,
      emailsReady,
      auth,
      blob,
      appUrl,
      legal,
      openai,
    },
    missing: [
      !stripe && "STRIPE_SECRET_KEY",
      !webhook && "STRIPE_WEBHOOK_SECRET",
      !resend && "RESEND_API_KEY",
      !auth && "AUTH_SECRET (32+ caractères)",
      !blob && "BLOB_READ_WRITE_TOKEN",
      !appUrl && "NEXT_PUBLIC_APP_URL",
      !legal && "LEGAL_* (4 variables)",
    ].filter(Boolean),
  });
}
