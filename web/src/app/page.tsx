import Link from "next/link";
import {
  ShieldCheck,
  TrendingDown,
  Scale,
  Zap,
  ArrowRight,
  X,
  Check,
} from "lucide-react";
import { FaqSection } from "@/components/faq-section";

const STATS = [
  { value: "2,4 Md€", label: "de préjudice annuel lié aux arnaques travaux (sources publiques)" },
  { value: "1 aperçu", label: "gratuit à vie — score + alertes (sans détail)" },
  { value: "19 €", label: "rapport complet par devis — sans abonnement" },
];

const STEPS = [
  {
    icon: Zap,
    title: "Déposez votre devis",
    desc: "PDF (glisser-déposer) ou texte copié depuis email. 30 secondes.",
  },
  {
    icon: Scale,
    title: "Analyse automatique",
    desc: "Vérification légale, prix régionaux, patterns d'arnaque.",
  },
  {
    icon: TrendingDown,
    title: "Négociez ou refusez",
    desc: "Rapport complet + lettre de négociation pour payer le juste prix.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-100/40 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-1.5 text-sm font-medium text-emerald-800 shadow-sm">
              <ShieldCheck className="h-4 w-4" />
              1ère plateforme d&apos;analyse de devis travaux en France
            </span>
            <h1 className="mt-8 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Ne signez plus un devis{" "}
              <span className="text-emerald-600">qui vous coûte cher</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-600 sm:text-xl">
              RénovSûr analyse votre devis en 30 secondes : arnaques, clauses
              illégales, prix gonflés. Identifiez les points à négocier{" "}
              <strong className="text-slate-900">avant de signer</strong>.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/analyser"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-700"
              >
                Analyser mon devis gratuitement
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/tarifs"
                className="text-sm font-semibold text-slate-600 hover:text-emerald-700"
              >
                Voir les tarifs →
              </Link>
            </div>
            <p className="mt-6 text-xs text-slate-500">
              Analyse indicative · Données hébergées en UE (RGPD) · Paiement sécurisé Stripe
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-3">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm"
              >
                <p className="text-2xl font-bold text-emerald-700">{s.value}</p>
                <p className="mt-1 text-sm text-slate-600">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-3xl font-bold text-slate-900">
          Pourquoi RénovSûr est différent
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-slate-600">
          Pas un chatbot juridique générique. Un outil vertical spécialisé devis
          BTP, calibré sur le marché français et les arnaques documentées par la
          DGCCRF.
        </p>
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {STEPS.map((step) => (
            <div
              key={step.title}
              className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <step.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-3xl font-bold text-slate-900">
          RénovSûr vs les alternatives
        </h2>
        <div className="mt-10 overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full min-w-[500px] text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left" />
                <th className="px-4 py-3 text-center font-bold text-emerald-700">RénovSûr</th>
                <th className="px-4 py-3 text-center text-slate-500">Chatbot IA générique</th>
                <th className="px-4 py-3 text-center text-slate-500">Comparateur devis</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Spécialisé devis BTP France", true, false, true],
                ["Détection arnaques DGCCRF", true, false, false],
                ["Benchmark prix régional", true, false, false],
                ["Lettre de négociation", true, false, false],
                ["Gratuit pour commencer", true, true, false],
              ].map(([label, rs, chat, comp]) => (
                <tr key={String(label)} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium">{label}</td>
                  <td className="px-4 py-3 text-center">
                    {rs ? <Check className="mx-auto h-5 w-5 text-emerald-600" /> : <X className="mx-auto h-5 w-5 text-slate-300" />}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {chat ? <Check className="mx-auto h-5 w-5 text-slate-400" /> : <X className="mx-auto h-5 w-5 text-slate-300" />}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {comp ? <Check className="mx-auto h-5 w-5 text-slate-400" /> : <X className="mx-auto h-5 w-5 text-slate-300" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-3xl font-bold text-slate-900">Questions fréquentes</h2>
        <div className="mt-10">
          <FaqSection limit={5} />
        </div>
        <p className="mt-8 text-center">
          <Link href="/faq" className="text-sm font-semibold text-emerald-600 hover:underline">
            Voir toutes les questions →
          </Link>
        </p>
      </section>

      <section className="bg-slate-950 py-20 text-white">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold">
            Un mauvais devis = des milliers d&apos;euros perdus
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            1 rapport à 19 € peut vous éviter un surcoût de 15 %. C&apos;est le
            meilleur investissement avant vos travaux.
          </p>
          <Link
            href="/analyser"
            className="mt-8 inline-flex rounded-full bg-emerald-500 px-8 py-4 font-semibold text-white transition hover:bg-emerald-400"
          >
            Tester gratuitement maintenant
          </Link>
        </div>
      </section>
    </>
  );
}
