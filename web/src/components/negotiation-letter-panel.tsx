"use client";

import { useState } from "react";
import { Download, Lightbulb } from "lucide-react";

export function NegotiationLetterPanel({
  advice,
  letter,
  artisanLabel,
}: {
  advice: string[];
  letter: string;
  artisanLabel?: string;
}) {
  const [downloading, setDownloading] = useState(false);

  async function saveLetterPdf() {
    setDownloading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const margin = 20;
      const maxWidth = 170;
      const lines = doc.splitTextToSize(letter, maxWidth);
      let y = margin;
      const lineHeight = 6;

      for (const line of lines) {
        if (y > 280) {
          doc.addPage();
          y = margin;
        }
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.text(line, margin, y);
        y += lineHeight;
      }

      const safeName = (artisanLabel ?? "devis")
        .replace(/[^\w\s-]/g, "")
        .slice(0, 40)
        .trim()
        .replace(/\s+/g, "-");
      doc.save(`lettre-negociation-${safeName || "renovsur"}.pdf`);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="mt-12 space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-600" />
          <h2 className="text-xl font-bold text-slate-900">Conseils avant signature</h2>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Recommandations pour vous — à lire avant d&apos;envoyer la lettre ci-dessous.
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-700">
          {advice.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8 print:hidden">
        <h2 className="text-xl font-bold text-emerald-950">Lettre à envoyer à l&apos;artisan</h2>
        <p className="mt-2 text-sm text-emerald-900/80">
          Texte prêt à l&apos;emploi, personnalisé selon votre devis. Relisez, complétez vos
          coordonnées en bas de page, puis enregistrez en PDF.
        </p>
        <div
          id="negotiation-letter-content"
          className="mt-4 whitespace-pre-wrap rounded-2xl bg-white p-6 font-serif text-sm leading-relaxed text-slate-800 shadow-sm"
        >
          {letter}
        </div>
        <button
          type="button"
          onClick={() => void saveLetterPdf()}
          disabled={downloading}
          className="no-print mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          <Download className="h-4 w-4" />
          {downloading ? "Génération…" : "Enregistrer la lettre (PDF)"}
        </button>
      </section>
    </div>
  );
}
