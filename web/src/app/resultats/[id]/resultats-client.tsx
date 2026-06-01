"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lock, Download, CheckCircle2, XCircle, PartyPopper, ShieldAlert } from "lucide-react";
import type { AnalysisResult } from "@/lib/types";
import type { AlertCounts } from "@/lib/free-tier";
import { ScoreGauge } from "@/components/score-gauge";
import { AlertCard } from "@/components/alert-card";
import { PricingCards } from "@/components/pricing-cards";
import { FreePlanBanner } from "@/components/free-plan-banner";
import { CopyReportLink } from "@/components/copy-report-link";
import { Disclaimer } from "@/components/disclaimer";
import { PaymentNotice } from "@/components/payment-notice";
import { RegistryVerificationCards } from "@/components/registry-verification-card";
import { formatEuro, formatDate } from "@/lib/utils";
import { loadReportFromSession } from "@/lib/report-session";
import { countAlerts, computeLegalPercent } from "@/lib/free-tier";

export function ResultatsClient({
  reportId,
  initialReport,
  alertCounts: initialAlertCounts,
  legalScorePercent: initialLegalPercent,
  realSavings,
  showPaidSuccess,
  paymentNotice,
  demoMode,
}: {
  reportId: string;
  initialReport: AnalysisResult | null;
  alertCounts?: AlertCounts;
  legalScorePercent?: number;
  realSavings?: number;
  showPaidSuccess?: boolean;
  paymentNotice?: "cancel" | "error" | null;
  /** Rapport fictif sur /exemple-rapport — pas d'appels API */
  demoMode?: boolean;
}) {
  const [report, setReport] = useState<AnalysisResult | null>(initialReport);
  const [loading, setLoading] = useState(!initialReport);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingFull, setLoadingFull] = useState(false);

  useEffect(() => {
    if (demoMode || initialReport) return;

    const cached = loadReportFromSession(reportId);
    if (cached) {
      setReport(cached);
      setLoading(false);
      return;
    }

    fetch(`/api/reports/${reportId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.id) {
          setReport(data as AnalysisResult);
        } else {
          setLoadError(
            "Rapport introuvable sur le serveur. Relancez une analyse depuis la page Analyser.",
          );
        }
      })
      .catch(() => {
        setLoadError("Impossible de charger le rapport. Vérifiez votre connexion.");
      })
      .finally(() => setLoading(false));
  }, [reportId, initialReport, demoMode]);

  async function loadFullReport() {
    if (!report) return;
    setLoadingFull(true);
    try {
      const res = await fetch(`/api/reports/${report.id}`);
      const data = await res.json();
      if (data.id && data.isPaid) {
        setReport(data);
      }
    } finally {
      setLoadingFull(false);
    }
  }

  useEffect(() => {
    if (demoMode) return;
    if (!report || !report.isPaid) {
      if (!report) return;
      const interval = setInterval(() => {
        fetch(`/api/reports/${report.id}`)
          .then((r) => r.json())
          .then((data) => {
            if (data.isPaid) setReport(data);
          })
          .catch(() => {});
      }, 5000);
      return () => clearInterval(interval);
    }
    loadFullReport();
  }, [report?.id, report?.isPaid, demoMode]);

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-600">
        <p className="font-medium">Chargement de votre rapport…</p>
      </div>
    );
  }

  if (!report || loadError) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-6xl font-bold text-emerald-600">404</p>
        <h1 className="mt-4 text-xl font-bold text-slate-900">Rapport introuvable</h1>
        <p className="mt-2 text-slate-600">
          {loadError ??
            "Ce rapport n&apos;existe plus ou le lien est incorrect. Faites une nouvelle analyse."}
        </p>
        <Link
          href="/analyser"
          className="mt-8 inline-block rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Analyser un devis
        </Link>
      </div>
    );
  }

  const alertCounts = initialAlertCounts ?? countAlerts(report.alerts);
  const legalScorePercent = initialLegalPercent ?? computeLegalPercent(report.legalChecks);
  const isPaid = report.isPaid;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      {paymentNotice && <PaymentNotice variant={paymentNotice} />}
      {showPaidSuccess && isPaid && (
        <div className="no-print mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-900">
          <PartyPopper className="h-5 w-5 shrink-0" />
          <div className="text-sm font-medium">
            <p>Paiement confirmé — rapport complet débloqué.</p>
            <p className="mt-1 font-normal text-emerald-800">
              Un email avec le lien vous a été envoyé si vous avez indiqué votre adresse.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="text-center sm:text-left">
          <p className="text-sm text-slate-500">
            Rapport du {formatDate(report.createdAt)}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            Résultat de l&apos;analyse
          </h1>
        </div>
        {!demoMode && (
          <div className="no-print flex justify-center sm:justify-end">
            <CopyReportLink reportId={report.id} />
          </div>
        )}
      </div>

      <div className="mt-10 flex flex-col items-center gap-8 rounded-3xl border border-slate-100 bg-white p-8 shadow-lg sm:flex-row sm:justify-around">
        <ScoreGauge score={report.score} label={report.scoreLabel} />
        <div className="max-w-md text-center sm:text-left">
          <p className="leading-relaxed text-slate-700">{report.summary}</p>
          {report.input.totalAmount > 0 && (
            <p className="mt-4 text-sm font-semibold text-slate-900">
              Montant analysé : {formatEuro(report.input.totalAmount)} TTC
            </p>
          )}
          {isPaid && realSavings !== undefined && realSavings > 0 && (
            <p className="mt-2 text-sm font-semibold text-emerald-700">
              Économie potentielle estimée : {formatEuro(realSavings)}
            </p>
          )}
          {!isPaid && (
            <p className="mt-2 text-sm font-medium text-amber-800">
              Montant des économies : visible après déblocage (19 €)
            </p>
          )}
        </div>
      </div>

      {!isPaid && (
        <div className="no-print mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-center">
            <p className="text-2xl font-bold text-red-600">{alertCounts.critical}</p>
            <p className="text-xs font-medium text-red-800">Alertes critiques</p>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{alertCounts.warning}</p>
            <p className="text-xs font-medium text-amber-800">Vigilance</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-center">
            <p className="text-2xl font-bold text-slate-700">{legalScorePercent}%</p>
            <p className="text-xs font-medium text-slate-600">Conformité légale</p>
          </div>
        </div>
      )}

      <div className="mt-6">
        <Disclaimer />
      </div>

      {(report.siretVerification || report.rgeVerification || report.decennaleVerification) && (
        <div className="mt-8">
          <RegistryVerificationCards
            siret={report.siretVerification}
            rge={report.rgeVerification}
            decennale={report.decennaleVerification}
            compact={!isPaid}
          />
        </div>
      )}

      {!isPaid && (
        <div className="no-print mt-8">
          <FreePlanBanner />
        </div>
      )}

      {loadingFull && (
        <p className="mt-4 text-center text-sm text-slate-500">Chargement du rapport complet…</p>
      )}

      <section className="mt-12">
        <h2 className="text-xl font-bold text-slate-900">
          Alertes ({alertCounts.total})
          {!isPaid && (
            <span className="ml-2 text-sm font-normal text-slate-500">
              — contenu masqué
            </span>
          )}
        </h2>
        <div className="mt-6 space-y-4">
          {report.alerts.map((alert) => (
            <div key={alert.id} className="relative">
              <AlertCard alert={alert} blurred={!isPaid} />
              {!isPaid && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-white/60">
                  <span className="flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white">
                    <Lock className="h-3.5 w-3.5" />
                    Débloquer pour lire
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
        {!isPaid && alertCounts.total > 3 && (
          <p className="no-print mt-4 flex items-center justify-center gap-2 text-sm text-slate-600">
            <ShieldAlert className="h-4 w-4 text-amber-600" />
            +{alertCounts.total - report.alerts.length} alerte(s) supplémentaire(s) dans le rapport payant
          </p>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold text-slate-900">Conformité légale</h2>
        {!isPaid && (
          <p className="mt-2 text-sm text-slate-500">
            {legalScorePercent}% de conformité — détail des {report.legalChecks.length} points dans le rapport complet.
          </p>
        )}
        <ul className="mt-4 space-y-3">
          {report.legalChecks.map((check, i) => (
            <li
              key={`${check.label}-${i}`}
              className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3"
            >
              {check.passed ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              ) : (
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
              )}
              <div>
                <p className="font-medium text-slate-900">{check.label}</p>
                <p className="text-sm text-slate-600">{check.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {isPaid && report.priceComparisons.length > 0 && (
        <section className="mt-12 print:break-inside-avoid">
          <h2 className="text-xl font-bold text-slate-900">Comparaison des prix</h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold">Poste</th>
                  <th className="px-4 py-3 font-semibold">Votre prix</th>
                  <th className="px-4 py-3 font-semibold">Marché</th>
                  <th className="px-4 py-3 font-semibold">Écart</th>
                </tr>
              </thead>
              <tbody>
                {report.priceComparisons.map((c) => (
                  <tr key={c.item} className="border-t border-slate-100">
                    <td className="px-4 py-3">{c.item}</td>
                    <td className="px-4 py-3">{formatEuro(c.yourPrice)}</td>
                    <td className="px-4 py-3">{formatEuro(c.marketAverage)}</td>
                    <td className={`px-4 py-3 font-semibold ${
                      c.status === "ok" ? "text-emerald-600" : "text-red-600"
                    }`}>
                      {c.deviationPercent > 0 ? "+" : ""}{c.deviationPercent}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {!isPaid && (
        <section className="no-print mt-12 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <Lock className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-3 font-semibold text-slate-800">
            Comparaison prix, lettre de négociation et économies chiffrées
          </p>
          <p className="mt-1 text-sm text-slate-600">Réservées au rapport débloqué</p>
        </section>
      )}

      {isPaid && report.plan === "negotiation" && (
        <section className="mt-12 rounded-3xl border border-emerald-200 bg-emerald-50 p-8 print:break-inside-avoid">
          <h2 className="text-xl font-bold text-emerald-950">Lettre de négociation</h2>
          <div className="mt-4 rounded-2xl bg-white p-6 text-sm leading-relaxed text-slate-700">
            <p>Objet : Demande de révision du devis travaux</p>
            <p className="mt-4">Madame, Monsieur,</p>
            <p className="mt-4">
              Suite à l&apos;analyse de votre devis d&apos;un montant de{" "}
              {formatEuro(report.input.totalAmount)}, plusieurs points nécessitent
              clarification avant signature :
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5">
              {report.negotiationPoints.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <p className="mt-4">
              Je vous prie de bien vouloir me transmettre un devis révisé sous 15 jours ouvrés.
            </p>
            <p className="mt-6">Cordialement,</p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="no-print mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white"
          >
            <Download className="h-4 w-4" />
            Imprimer / PDF
          </button>
        </section>
      )}

      {!isPaid && (
        <section className="no-print mt-16">
          <h2 className="text-center text-2xl font-bold text-slate-900">
            Débloquer ce rapport — 19 €
          </h2>
          <p className="mt-2 text-center text-slate-600">
            C&apos;est ici que se trouve la valeur : détails, prix marché, négociation
          </p>
          <div className="mt-8">
            <PricingCards reportId={report.id} compact />
          </div>
        </section>
      )}

      <div className="no-print mt-12 text-center">
        <Link href="/analyser" className="text-sm font-medium text-emerald-600 hover:underline">
          ← Analyser un autre devis (payant ou crédit pack)
        </Link>
      </div>
    </div>
  );
}
