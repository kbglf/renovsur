import { Resend } from "resend";
import { getAppUrl } from "./stripe";
import { PLANS, type PlanId } from "./stripe";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

const FROM = process.env.EMAIL_FROM ?? "RénovSûr <noreply@renovsur.fr>";

export async function sendReportReadyEmail(params: {
  to: string;
  reportId: string;
  planId: PlanId;
  score: number;
}): Promise<{ sent: boolean; reason?: string }> {
  const resend = getResend();
  const reportUrl = `${getAppUrl()}/resultats/${params.reportId}`;
  const planName = PLANS[params.planId]?.name ?? "Rapport";

  if (!resend) {
    if (process.env.NODE_ENV === "development") {
      console.log("[Email dev]", { to: params.to, reportUrl, planName });
      return { sent: true, reason: "dev-log" };
    }
    return { sent: false, reason: "RESEND_API_KEY manquant" };
  }

  try {
    await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: `Votre ${planName} est prêt — RénovSûr`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
          <h1 style="color:#059669">RénovSûr</h1>
          <p>Bonjour,</p>
          <p>Votre <strong>${planName}</strong> est disponible (score : <strong>${params.score}/100</strong>).</p>
          <p style="margin:24px 0">
            <a href="${reportUrl}" style="background:#059669;color:white;padding:14px 28px;border-radius:999px;text-decoration:none;font-weight:600">
              Voir mon rapport complet
            </a>
          </p>
          <p style="font-size:13px;color:#64748b">
            Vous pouvez aussi retrouver tous vos rapports sur
            <a href="${getAppUrl()}/compte">votre espace compte</a>.
          </p>
          <p style="font-size:12px;color:#94a3b8">Ce lien reste valide. Ne partagez pas ce devis s'il contient des données personnelles.</p>
        </div>
      `,
    });
    return { sent: true };
  } catch {
    return { sent: false, reason: "envoi échoué" };
  }
}

export async function sendLoginCodeEmail(params: {
  to: string;
  code: string;
}): Promise<{ sent: boolean }> {
  const resend = getResend();

  if (!resend) {
    if (process.env.NODE_ENV === "development") {
      console.log("[OTP dev]", params.to, params.code);
      return { sent: true };
    }
    return { sent: false };
  }

  try {
    await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: "Votre code de connexion — RénovSûr",
      html: `
        <div style="font-family:sans-serif;max-width:480px">
          <h2 style="color:#059669">Connexion RénovSûr</h2>
          <p>Votre code à usage unique :</p>
          <p style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#059669">${params.code}</p>
          <p style="font-size:13px;color:#64748b">Valide 15 minutes. Si vous n'avez pas demandé ce code, ignorez cet email.</p>
        </div>
      `,
    });
    return { sent: true };
  } catch {
    return { sent: false };
  }
}
