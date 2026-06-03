import { NextRequest } from "next/server";
import { z } from "zod";
import { analyzeQuote } from "@/lib/analyzer";
import { getReport, saveReport } from "@/lib/db";
import type { AnalysisResult } from "@/lib/types";
import { jsonWithCors, optionsResponse } from "@/lib/cors";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp, sanitizeQuoteText } from "@/lib/sanitize";
import {
  DEVICE_COOKIE,
  MAX_QUOTE_LENGTH,
  MIN_QUOTE_LENGTH,
} from "@/lib/constants";
import { checkFreeQuota, recordFreePreview, isSampleQuote } from "@/lib/quota";
import { consumeCredit, getCredits } from "@/lib/credits";
import { countAlerts, computeLegalPercent, toFreePreview } from "@/lib/free-tier";

const workTypes = [
  "peinture", "carrelage", "plomberie", "electricite", "isolation",
  "menuiserie", "toiture", "maconnerie", "autre",
] as const;

const regions = [
  "ile-de-france", "paca", "auvergne-rhone-alpes", "occitanie",
  "nouvelle-aquitaine", "autre",
] as const;

const schema = z.object({
  quoteText: z.string().min(MIN_QUOTE_LENGTH).max(MAX_QUOTE_LENGTH),
  workType: z.enum(workTypes).optional(),
  region: z.enum(regions).optional(),
  surfaceM2: z.number().positive().max(10_000).optional(),
  totalAmount: z.number().positive().max(10_000_000).optional(),
  depositPercent: z.number().min(0).max(100).optional(),
  artisanName: z.string().max(200).optional(),
  providerSiret: z.string().max(20).optional(),
  siret: z.string().max(20).optional(),
  email: z.string().email().optional(),
});

export async function OPTIONS(req: NextRequest) {
  return optionsResponse(req.headers.get("origin"));
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  const ip = getClientIp(req);
  const deviceId = req.cookies.get(DEVICE_COOKIE)?.value ?? `ip:${ip}`;

  const spamLimit = checkRateLimit(`analyze:${ip}`);
  if (!spamLimit.ok) {
    return jsonWithCors(
      { error: "Trop de requêtes.", code: "RATE_LIMIT" },
      origin,
      { status: 429 },
    );
  }

  try {
    const body = await req.json();
    const quoteText = sanitizeQuoteText(body.quoteText ?? "");
    const parsed = schema.safeParse({ ...body, quoteText });

    if (!parsed.success) {
      return jsonWithCors(
        { error: parsed.error.issues[0]?.message ?? "Données invalides" },
        origin,
        { status: 400 },
      );
    }

    const quota = await checkFreeQuota(ip, deviceId, quoteText);

    if (!quota.allowed && quota.reason === "duplicate" && quota.existingReportId) {
      const existing = await getReport(quota.existingReportId);
      if (existing) {
        return jsonWithCors(
          {
            error: "Ce devis a déjà un rapport. Débloquez-le ou analysez un autre devis.",
            code: "DUPLICATE_QUOTE",
            existingReportId: quota.existingReportId,
            report: existing.isPaid ? existing : toFreePreview(existing),
          },
          origin,
          { status: 409 },
        );
      }
      // Entrée quota orpheline (rapport perdu) — on laisse passer une nouvelle analyse
    }

    const credit = await getCredits(deviceId);
    const useCredit =
      !quota.allowed &&
      quota.reason === "lifetime_used" &&
      credit !== null &&
      credit.balance > 0;

    if (!quota.allowed && !useCredit) {
      const creditsLeft = credit?.balance ?? 0;
      return jsonWithCors(
        {
          error:
            "Votre aperçu gratuit unique est utilisé. Payez 19 € par devis détaillé, ou achetez le Pack 3 devis (49 €).",
          code: "PAYMENT_REQUIRED",
          creditsRemaining: creditsLeft,
        },
        origin,
        { status: 402 },
      );
    }

    let consumedPlan: AnalysisResult["plan"] | null = null;
    if (useCredit) {
      const consumed = await consumeCredit(deviceId);
      if (!consumed) {
        return jsonWithCors(
          {
            error: "Crédit pack épuisé. Achetez un rapport ou un nouveau pack.",
            code: "NO_CREDITS",
          },
          origin,
          { status: 402 },
        );
      }
      consumedPlan = consumed.plan;
    }

    const full = analyzeQuote(parsed.data);

    const providerHint = parsed.data.providerSiret;
    const useAi = Boolean(consumedPlan);

    const { enrichReport } = await import("@/lib/report-enrich");
    const siretLimit = checkRateLimit(`siret:${ip}`);
    if (siretLimit.ok) {
      await enrichReport(full, {
        useAi,
        providerSiretHint: providerHint,
      });
    }

    if (consumedPlan) {
      full.isPaid = true;
      full.plan = consumedPlan;
      full.paidWithCredit = true;
    } else if (quota.allowed) {
      await recordFreePreview(ip, deviceId, quoteText, full.id);
    }

    if (parsed.data.email) {
      full.email = parsed.data.email.trim().toLowerCase();
    }

    await saveReport(full);

    if (full.isPaid) {
      const recipient = full.email ?? full.input.email;
      if (recipient) {
        const { sendReportReadyEmail } = await import("@/lib/email");
        await sendReportReadyEmail({
          to: recipient,
          reportId: full.id,
          planId: full.plan === "negotiation" ? "negotiation" : "complete",
          score: full.score,
        });
      }
      return jsonWithCors(
        {
          id: full.id,
          report: full,
          score: full.score,
          scoreLabel: full.scoreLabel,
          summary: full.summary,
          alertCounts: countAlerts(full.alerts),
          legalScorePercent: computeLegalPercent(full.legalChecks),
          alerts: full.alerts,
          isPaid: true,
          plan: full.plan,
          paidWithCredit: full.paidWithCredit,
        },
        origin,
      );
    }

    const preview = toFreePreview(full);
    return jsonWithCors({
      id: full.id,
      report: preview,
      score: preview.score,
      scoreLabel: preview.scoreLabel,
      summary: preview.summary,
      alertCounts: countAlerts(full.alerts),
      legalScorePercent: computeLegalPercent(full.legalChecks),
      alerts: preview.alerts,
      isPaid: false,
      isSample: isSampleQuote(quoteText),
      freePreviewRemaining: quota.allowed ? quota.freePreviewRemaining : 0,
      requiresPayment: true,
      message:
        "Aperçu unique — débloquez ce devis (19 €) pour tout le détail.",
    }, origin);
  } catch {
    return jsonWithCors(
      { error: "Erreur serveur lors de l'analyse" },
      origin,
      { status: 500 },
    );
  }
}
