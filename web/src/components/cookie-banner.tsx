"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "renovsur-cookie-consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, "essential");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Consentement cookies"
      className="fixed bottom-0 left-0 right-0 z-[100] border-t border-slate-200 bg-white p-4 shadow-2xl sm:p-6"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          Nous utilisons uniquement des cookies essentiels (session, appareil pour
          l&apos;aperçu gratuit). Aucun cookie publicitaire.{" "}
          <Link href="/confidentialite" className="font-medium text-emerald-600 underline">
            Politique de confidentialité
          </Link>
        </p>
        <button
          type="button"
          onClick={accept}
          className="shrink-0 rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          J&apos;ai compris
        </button>
      </div>
    </div>
  );
}
