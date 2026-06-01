"use client";

import { useState } from "react";
import { Download, FileType, Lightbulb } from "lucide-react";
import { downloadLetterAsWord } from "@/lib/download-letter";

export function NegotiationLetterPanel({
  advice,
  letter,
  artisanLabel,
}: {
  advice: string[];
  letter: string;
  artisanLabel?: string;
}) {
  const [downloading, setDownloading] = useState<"pdf" | "word" | null>(null);

  async function saveLetterPdf() {
    setDownloading("pdf");
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
      setDownloading(null);
    }
  }

  function saveLetterWord() {
    setDownloading("word");
    try {
      downloadLetterAsWord(
        letter,
        `lettre-negociation-${artisanLabel ?? "renovsur"}`,
      );
    } finally {
      setDownloading(null);
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
          Texte prêt à l&apos;emploi, personnalisé selon votre devis. Téléchargez en Word pour
          compléter vos coordonnées et modifier le texte, ou en PDF pour envoi direct.
        </p>
        <div
          id="negotiation-letter-content"
          className="mt-4 whitespace-pre-wrap rounded-2xl bg-white p-6 font-serif text-sm leading-relaxed text-slate-800 shadow-sm"
        >
          {letter}
        </div>
        <div className="no-print mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => saveLetterWord()}
            disabled={downloading !== null}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            <FileType className="h-4 w-4" />
            {downloading === "word" ? "Génération…" : "Enregistrer en Word (.doc)"}
          </button>
          <button
            type="button"
            onClick={() => void saveLetterPdf()}
            disabled={downloading !== null}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            {downloading === "pdf" ? "Génération…" : "Enregistrer en PDF"}
          </button>
        </div>
        <p className="mt-2 text-xs text-emerald-900/70">
          Le fichier Word s&apos;ouvre dans Microsoft Word ou LibreOffice — vous pouvez y
          ajouter votre nom, adresse et personnaliser chaque phrase.
        </p>
      </section>
    </div>
  );
}
