import { FaqSection } from "@/components/faq-section";
import Link from "next/link";

export const metadata = {
  title: "FAQ — Questions fréquentes",
  description: "Tout savoir sur l'analyse de devis RénovSûr, tarifs, sécurité et compte.",
};

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-bold text-slate-900">Questions fréquentes</h1>
      <p className="mt-3 text-slate-600">
        Tout ce qu&apos;il faut savoir avant d&apos;analyser votre devis.
      </p>
      <div className="mt-10">
        <FaqSection />
      </div>
      <p className="mt-10 text-center text-sm text-slate-500">
        Une autre question ?{" "}
        <Link href="/contact" className="font-medium text-emerald-600 hover:underline">
          Contactez-nous
        </Link>
      </p>
    </div>
  );
}
