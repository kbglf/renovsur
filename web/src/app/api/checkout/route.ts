import { NextRequest, NextResponse } from "next/server";
import { getReport, updateReportPlan } from "@/lib/db";
import { getStripe, PLANS, getAppUrl, type PlanId } from "@/lib/stripe";
import { DEVICE_COOKIE } from "@/lib/constants";
import { isDemoMode } from "@/lib/env";
import { addCredits } from "@/lib/credits";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/sanitize";
import { isValidReportId } from "@/lib/validate-id";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = checkRateLimit(`checkout:${ip}`);
  if (!limit.ok) {
    return NextResponse.json({ error: "Trop de tentatives de paiement." }, { status: 429 });
  }

  try {
    const { reportId, planId } = await req.json();
    const deviceId =
      req.cookies.get(DEVICE_COOKIE)?.value ?? "unknown";

    if (!planId || !(planId in PLANS)) {
      return NextResponse.json({ error: "Plan invalide" }, { status: 400 });
    }

    const plan = PLANS[planId as PlanId];

    if (planId === "compare3") {
      const stripe = getStripe();
      if (!stripe) {
        if (!isDemoMode()) {
          return NextResponse.json({ error: "Paiement indisponible" }, { status: 503 });
        }
        const balance = await addCredits(deviceId, PLANS.compare3.credits, "complete");
        return NextResponse.json({ demo: true, credits: balance });
      }

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: `RénovSûr — ${plan.name}`,
                description: plan.description,
              },
              unit_amount: plan.price,
            },
            quantity: 1,
          },
        ],
        metadata: { planId: "compare3", deviceId },
        success_url: `${getAppUrl()}/tarifs?session_id={CHECKOUT_SESSION_ID}&pack=1`,
        cancel_url: `${getAppUrl()}/tarifs?cancel=1`,
      });
      return NextResponse.json({ url: session.url });
    }

    if (!reportId) {
      return NextResponse.json({ error: "Rapport requis pour ce plan" }, { status: 400 });
    }

    if (!isValidReportId(reportId)) {
      return NextResponse.json({ error: "Identifiant rapport invalide" }, { status: 400 });
    }

    const report = await getReport(reportId);
    if (!report) {
      return NextResponse.json({ error: "Rapport introuvable" }, { status: 404 });
    }

    if (report.isPaid) {
      return NextResponse.json({ error: "Rapport déjà débloqué", alreadyPaid: true }, { status: 400 });
    }

    const stripe = getStripe();
    if (!stripe) {
      if (!isDemoMode()) {
        return NextResponse.json({ error: "Paiement indisponible" }, { status: 503 });
      }
      await updateReportPlan(reportId, planId);
      return NextResponse.json({ demo: true });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `RénovSûr — ${plan.name}`,
              description: plan.description,
            },
            unit_amount: plan.price,
          },
          quantity: 1,
        },
      ],
      metadata: { reportId, planId, deviceId },
      success_url: `${getAppUrl()}/resultats/${reportId}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getAppUrl()}/resultats/${reportId}?cancel=1`,
    });

    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json({ error: "Erreur de paiement" }, { status: 500 });
  }
}
