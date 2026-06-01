"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";

export function CopyReportLink({ reportId }: { reportId: string }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  async function copy() {
    setError(false);
    const url = `${window.location.origin}/resultats/${reportId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(true);
      setTimeout(() => setError(false), 3000);
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={copy}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-emerald-600" />
            Lien copié
          </>
        ) : (
          <>
            <Link2 className="h-4 w-4" />
            Copier le lien du rapport
          </>
        )}
      </button>
      {error && (
        <p className="text-xs text-red-600" role="alert">
          Copie impossible — copiez l&apos;URL depuis la barre d&apos;adresse.
        </p>
      )}
    </div>
  );
}
