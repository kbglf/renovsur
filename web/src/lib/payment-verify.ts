import type Stripe from "stripe";
import { getStripe, PLANS, type PlanId } from "./stripe";
import { getReport, updateReportPlan } from "./db";
import { addCredits, getCredits } from "./credits";
import { isSessionProcessed, markSessionProcessed } from "./stripe-idempotency";
import { sendReportReadyEmail } from "./email";

export type FulfillmentResult =
  | { ok: true; alreadyProcessed: boolean; redirect?: string; creditsAdded?: number }
  | { ok: false; error: string };

/** Source unique de vérité — webhook ET redirect success passent par ici */
export async function fulfillCheckoutSession(
  session: Stripe.Checkout.Session,
  fallbackDeviceId?: string,
): Promise<FulfillmentResult> {
  const sessionId = session.id;

  if (session.payment_status !== "paid") {
    return { ok: false, error: "Paiement non confirmé" };
  }

  const planId = session.metadata?.planId as PlanId | undefined;
  if (!planId || !(planId in PLANS)) {
    return { ok: false, error: "Plan invalide" };
  }

  const alreadyProcessed = await isSessionProcessed(sessionId);

  if (planId === "compare3") {
    const deviceId = session.metadata?.deviceId ?? fallbackDeviceId ?? "unknown";
    if (!alreadyProcessed) {
      await addCredits(deviceId, PLANS.compare3.credits, "complete");
      await markSessionProcessed({ sessionId, planId, deviceId });
    }
    const credits = await getCredits(deviceId);
    return {
      ok: true,
      alreadyProcessed,
      creditsAdded: PLANS.compare3.credits,
      redirect: `/analyser?credits=${credits?.balance ?? PLANS.compare3.credits}`,
    };
  }

  const reportId = session.metadata?.reportId;
  if (!reportId) {
    return { ok: false, error: "Rapport manquant dans la session" };
  }

  const report = await getReport(reportId);
  if (!report) {
    return { ok: false, error: "Rapport introuvable" };
  }

  if (!alreadyProcessed && !report.isPaid) {
    await updateReportPlan(reportId, planId);
    await markSessionProcessed({ sessionId, planId, reportId });
  }

  const updated = (await getReport(reportId)) ?? report;
  const recipient = updated.input.email ?? updated.email;
  if (recipient && !alreadyProcessed) {
    await sendReportReadyEmail({
      to: recipient,
      reportId,
      planId,
      score: updated.score,
    });
  }

  return {
    ok: true,
    alreadyProcessed,
    redirect: `/resultats/${reportId}?paid=1`,
  };
}

export async function verifyAndFulfillCheckout(
  reportId: string | null,
  sessionId: string,
  deviceId: string,
): Promise<FulfillmentResult> {
  const stripe = getStripe();
  if (!stripe) {
    return { ok: false, error: "Paiement non configuré" };
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (reportId && session.metadata?.reportId && session.metadata.reportId !== reportId) {
      return { ok: false, error: "Session invalide pour ce rapport" };
    }

    return fulfillCheckoutSession(session, deviceId);
  } catch {
    return { ok: false, error: "Vérification Stripe échouée" };
  }
}
