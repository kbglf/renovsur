import { cookies } from "next/headers";
import { QuoteForm } from "@/components/quote-form";
import { CreditsBanner } from "@/components/credits-banner";
import { PaymentNotice } from "@/components/payment-notice";
import { getCredits } from "@/lib/credits";
import { DEVICE_COOKIE } from "@/lib/constants";

export const metadata = {
  title: "Analyser un devis travaux",
  description:
    "Déposez votre PDF ou collez le texte : analyse gratuite (aperçu), rapport complet à partir de 19 €.",
};

interface Props {
  searchParams: Promise<{ credits?: string; cancel?: string }>;
}

export default async function AnalyserPage({ searchParams }: Props) {
  const search = await searchParams;
  const cookieStore = await cookies();
  const deviceId = cookieStore.get(DEVICE_COOKIE)?.value ?? "unknown";
  const creditBalance = await getCredits(deviceId);
  const balance = creditBalance?.balance ?? 0;
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
          Analysez votre devis
        </h1>
        <p className="mt-3 text-slate-600">
          <strong>1 aperçu gratuit à vie</strong> (score + compteurs) · Rapport Essentiel : 19 € ·
          Pack 3 devis : 49 €
        </p>
      </div>

      <div className="mt-8 space-y-4">
        {search.cancel === "1" && <PaymentNotice variant="cancel" />}
        {balance > 0 && <CreditsBanner balance={balance} />}
      </div>

      <div className="mt-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-lg sm:p-10">
        <QuoteForm />
      </div>
    </div>
  );
}
