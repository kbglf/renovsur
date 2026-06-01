"use client";

import { useCallback, useState } from "react";
import { FileUp, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PdfDropzoneProps {
  onTextExtracted: (text: string, fileName: string) => void;
  disabled?: boolean;
}

export function PdfDropzone({ onTextExtracted, disabled }: PdfDropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [lastFile, setLastFile] = useState<string | null>(null);
  const [error, setError] = useState("");

  const processFile = useCallback(
    async (file: File) => {
      setError("");
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        setError("Seuls les fichiers PDF sont acceptés.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("PDF trop volumineux (max 10 Mo).");
        return;
      }

      setParsing(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/parse-pdf", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur lecture PDF");

        onTextExtracted(data.text, data.fileName);
        setLastFile(`${data.fileName} (${data.pages} page${data.pages > 1 ? "s" : ""})`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur PDF");
        setLastFile(null);
      } finally {
        setParsing(false);
      }
    },
    [onTextExtracted],
  );

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (disabled || parsing) return;
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 transition",
          dragging
            ? "border-emerald-500 bg-emerald-50"
            : "border-slate-200 bg-slate-50/50 hover:border-emerald-300",
          (disabled || parsing) && "pointer-events-none opacity-60",
        )}
      >
        {parsing ? (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
            <p className="mt-3 text-sm font-medium text-slate-700">Lecture du PDF…</p>
          </>
        ) : lastFile ? (
          <>
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            <p className="mt-3 text-sm font-semibold text-emerald-800">{lastFile}</p>
            <p className="text-xs text-slate-500">Texte extrait — vérifiez ci-dessous puis analysez</p>
          </>
        ) : (
          <>
            <FileUp className="h-10 w-10 text-emerald-600" />
            <p className="mt-3 text-sm font-semibold text-slate-800">
              Déposez votre devis PDF ici
            </p>
            <p className="mt-1 text-xs text-slate-500">ou</p>
            <label className="mt-2 cursor-pointer rounded-full bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm ring-1 ring-emerald-200 hover:bg-emerald-50">
              Choisir un fichier
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="sr-only"
                disabled={disabled || parsing}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) processFile(file);
                }}
              />
            </label>
            <p className="mt-2 text-xs text-slate-400">PDF jusqu&apos;à 10 Mo · multi-pages OK</p>
          </>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
