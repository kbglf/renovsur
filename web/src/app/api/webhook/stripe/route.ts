import { NextRequest, NextResponse } from "next/server";
import { getStripe, type PlanId } from "@/lib/stripe";
import { fulfillCheckoutSession } from "@/lib/payment-verify";

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Webhook non configuré" }, { status: 503 });
    }
    return NextResponse.json({ received: true, skipped: true });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);

    if (event.type === "checkout.session.completed") {
      await fulfillCheckoutSession(event.data.object);
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }
}
