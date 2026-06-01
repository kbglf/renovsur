"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, FileText, Sparkles } from "lucide-react";
import type { Region, WorkType } from "@/lib/types";
import { SAMPLE_QUOTE, MAX_QUOTE_LENGTH, MIN_QUOTE_LENGTH } from "@/lib/constants";
import { PdfDropzone } from "@/components/pdf-dropzone";
import { saveReportToSession } from "@/lib/report-session";
import type { AnalysisResult } from "@/lib/types";

const WORK_TYPES: { value: WorkType; label: string }[] = [
  { value: "peinture", label: "Peinture" },
  { value: "carrelage", label: "Carrelage" },
  { value: "plomberie", label: "Plomberie" },
  { value: "electricite", label: "Électricité" },
  { value: "isolation", label: "Isolation" },
  { value: "menuiserie", label: "Menuiserie" },
  { value: "toiture", label: "Toiture" },
  { value: "maconnerie", label: "Maçonnerie" },
  { value: "autre", label: "Autre" },
];

const REGIONS: { value: Region; label: string }[] = [
  { value: "ile-de-france", label: "Île-de-France" },
  { value: "paca", label: "PACA" },
  { value: "auvergne-rhone-alpes", label: "Auvergne-Rhône-Alpes" },
  { value: "occitanie", label: "Occitanie" },
  { value: "nouvelle-aquitaine", label: "Nouvelle-Aquitaine" },
  { value: "autre", label: "Autre région" },
];

export function QuoteForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [quoteText, setQuoteText] = useState("");
  const [email, setEmail] = useState("");
  const [workType, setWorkType] = useState<WorkType>("autre");
  const [region, setRegion] = useState<Region>("autre");
  const [surfaceM2, setSurfaceM2] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [depositPercent, setDepositPercent] = useState("");

  function loadSample() {
    setQuoteText(SAMPLE_QUOTE);
    setWorkType("peinture");
    setRegion("ile-de-france");
    setSurfaceM2("35");
    setTotalAmount("2532");
    setDepositPercent("45");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (quoteText.trim().length < MIN_QUOTE_LENGTH) {
      setError(`Collez ou importez un devis d'au moins ${MIN_QUOTE_LENGTH} caractères.`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteText,
          workType,
          region,
          surfaceM2: surfaceM2 ? parseFloat(surfaceM2) : undefined,
          totalAmount: totalAmount ? parseFloat(totalAmount) : undefined,
          depositPercent: depositPercent ? parseFloat(depositPercent) : undefined,
          email: email || undefined,
        }),
      });

      const data = await res.json();
      if (res.status === 409 && data.existingReportId) {
        if (data.report) {
          saveReportToSession(data.report as AnalysisResult);
        }
        router.push(`/resultats/${data.existingReportId}`);
        return;
      }
      if (res.status === 402) {
        throw new Error(
          data.error ||
            "Aperçu gratuit déjà utilisé. Payez 19 € par devis ou le Pack 3 devis (49 €) sur la page Tarifs.",
        );
      }
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'analyse");
      }

      if (data.report) {
        saveReportToSession(data.report as AnalysisResult);
      }
      router.push(`/resultats/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PdfDropzone
        disabled={loading}
        onTextExtracted={(text) => {
          setQuoteText(text);
          setError("");
        }}
      />

      <div className="relative flex items-center gap-3 py-1">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-medium text-slate-400">ou collez le texte</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor="quoteText" className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <FileText className="h-4 w-4 text-emerald-600" />
          Texte du devis
        </label>
        <button
          type="button"
          onClick={loadSample}
          className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Essayer un exemple
        </button>
      </div>
      <textarea
        id="quoteText"
        rows={8}
        maxLength={MAX_QUOTE_LENGTH}
        value={quoteText}
        onChange={(e) => setQuoteText(e.target.value)}
        placeholder="Le texte extrait du PDF apparaît ici — vous pouvez le corriger avant analyse…"
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none ring-emerald-500/20 transition focus:border-emerald-400 focus:ring-4"
        required
        aria-describedby="quote-hint"
      />
      <p id="quote-hint" className="text-xs text-slate-500">
        {quoteText.length.toLocaleString("fr-FR")} / {MAX_QUOTE_LENGTH.toLocaleString("fr-FR")} caractères ·
        Données confidentielles (RGPD).
      </p>

      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-800">
          Email — pour recevoir le rapport et accéder à votre compte
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vous@exemple.fr"
          className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-400"
        />
        <p className="mt-1 text-xs text-slate-500">
          Recommandé : envoi automatique du rapport après paiement + accès sur{" "}
          <a href="/compte" className="font-medium text-emerald-600 hover:underline">
            Mon compte
          </a>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="workType" className="mb-2 block text-sm font-semibold text-slate-800">
            Type de travaux
          </label>
          <select
            id="workType"
            value={workType}
            onChange={(e) => setWorkType(e.target.value as WorkType)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-400"
          >
            {WORK_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="region" className="mb-2 block text-sm font-semibold text-slate-800">
            Votre région
          </label>
          <select
            id="region"
            value={region}
            onChange={(e) => setRegion(e.target.value as Region)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-400"
          >
            {REGIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="surface" className="mb-2 block text-sm font-semibold text-slate-800">
            Surface (m²)
          </label>
          <input
            id="surface"
            type="number"
            min="1"
            value={surfaceM2}
            onChange={(e) => setSurfaceM2(e.target.value)}
            placeholder="Ex: 35"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-400"
          />
        </div>
        <div>
          <label htmlFor="total" className="mb-2 block text-sm font-semibold text-slate-800">
            Montant TTC (€)
          </label>
          <input
            id="total"
            type="number"
            min="0"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            placeholder="Ex: 2050"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-400"
          />
        </div>
      </div>

      <div>
        <label htmlFor="deposit" className="mb-2 block text-sm font-semibold text-slate-800">
          Acompte demandé (%)
        </label>
        <input
          id="deposit"
          type="number"
          min="0"
          max="100"
          value={depositPercent}
          onChange={(e) => setDepositPercent(e.target.value)}
          placeholder="Ex: 30"
          className="w-full max-w-xs rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-400"
        />
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 disabled:opacity-60 sm:w-auto"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            Analyse en cours…
          </>
        ) : (
          <>
            <Upload className="h-5 w-5" aria-hidden />
            Analyser mon devis — gratuit
          </>
        )}
      </button>
    </form>
  );
}
