import { cookies } from "next/headers";
import { PricingCards } from "@/components/pricing-cards";
import { verifyAndFulfillCheckout } from "@/lib/payment-verify";
import { DEVICE_COOKIE } from "@/lib/constants";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PaymentNotice } from "@/components/payment-notice";

export const metadata = {
  title: "Tarifs — Paiement à l'acte",
  description: "19€ par devis, 39€ avec négociation, 49€ pour comparer 3 devis. Pas d'abonnement.",
};

interface Props {
  searchParams: Promise<{ session_id?: string; pack?: string; cancel?: string }>;
}

export default async function TarifsPage({ searchParams }: Props) {
  const search = await searchParams;
  let paymentNotice: "cancel" | "error" | null = null;

  if (search.cancel === "1") {
    paymentNotice = "cancel";
  } else if (search.session_id && search.pack) {
    const cookieStore = await cookies();
    const deviceId = cookieStore.get(DEVICE_COOKIE)?.value ?? "unknown";
    const verified = await verifyAndFulfillCheckout(null, search.session_id, deviceId);
    if (verified.ok && verified.redirect) {
      redirect(verified.redirect);
    }
    if (!verified.ok) {
      paymentNotice = "error";
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900">Payez à l&apos;acte</h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-600">
          Pas d&apos;abonnement. Vous achetez un rapport quand vous en avez besoin —
          avant de signer un devis à plusieurs milliers d&apos;euros.
        </p>
      </div>

      {paymentNotice && (
        <div className="mx-auto mt-8 max-w-3xl">
          <PaymentNotice variant={paymentNotice} />
        </div>
      )}

      <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-slate-100 bg-slate-50 p-6 text-sm text-slate-700">
        <p className="font-semibold text-slate-900">Comment ça marche</p>
        <ol className="mt-3 list-decimal space-y-2 pl-5">
          <li>
            <strong>1 aperçu gratuit à vie</strong> — score + nombre d&apos;alertes (sans détail).
          </li>
          <li>
            <strong>19 €</strong> — Rapport Essentiel (alertes, prix, légal).
          </li>
          <li>
            <strong>39 €</strong> — Rapport Négociation (Essentiel + lettre).
          </li>
          <li>
            <strong>49 €</strong> — pack 3 rapports pour comparer plusieurs artisans.
          </li>
        </ol>
      </div>

      <div className="mt-12">
        <PricingCards />
      </div>

      <p className="mt-10 text-center text-sm text-slate-500">
        Paiement unique · Stripe sécurisé ·{" "}
        <Link href="/analyser" className="font-medium text-emerald-600 hover:underline">
          Tester l&apos;aperçu gratuit →
        </Link>
      </p>
    </div>
  );
}
