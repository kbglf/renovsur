"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, LogOut, FileText } from "lucide-react";

interface ReportRow {
  id: string;
  createdAt: string;
  score: number;
  scoreLabel: string;
  totalAmount: string | null;
  isPaid: boolean;
  plan: string;
  url: string;
}

export function CompteClient() {
  const [step, setStep] = useState<"email" | "code" | "dashboard">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [reports, setReports] = useState<ReportRow[]>([]);

  async function loadReports() {
    try {
      const res = await fetch("/api/account/reports");
      if (res.status === 401) {
        setStep("email");
        return;
      }
      if (!res.ok) {
        throw new Error("Impossible de charger vos rapports");
      }
      const data = await res.json();
      if (data.reports) {
        setEmail(data.email);
        setReports(data.reports);
        setStep("dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setDevCode(null);
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.devCode) setDevCode(data.devCode);
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await loadReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setStep("email");
    setReports([]);
    setCode("");
  }

  if (step === "dashboard") {
    return (
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-slate-600">
            Connecté : <strong className="text-slate-900">{email}</strong>
          </p>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </button>
        </div>

        {reports.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-slate-200 p-10 text-center">
            <p className="text-slate-600">Aucun rapport pour cet email.</p>
            <Link
              href="/analyser"
              className="mt-4 inline-block text-sm font-semibold text-emerald-600 hover:underline"
            >
              Analyser un devis →
            </Link>
          </div>
        ) : (
          <ul className="mt-8 space-y-3">
            {reports.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="font-semibold text-slate-900">
                      Score {r.score}/100 — {r.scoreLabel}
                    </p>
                    <p className="text-sm text-slate-500">
                      {r.createdAt}
                      {r.totalAmount && ` · ${r.totalAmount} TTC`}
                    </p>
                    <span
                      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        r.isPaid
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {r.isPaid ? "Rapport débloqué" : "Aperçu gratuit"}
                    </span>
                  </div>
                </div>
                <Link
                  href={r.url}
                  className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Ouvrir
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold text-slate-900">Mon compte</h1>
      <p className="mt-2 text-sm text-slate-600">
        Retrouvez tous vos rapports liés à votre email (code de connexion).
      </p>

      {step === "email" ? (
        <form onSubmit={sendCode} className="mt-8 space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.fr"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-400"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Recevoir un code
          </button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="mt-8 space-y-4">
          <p className="text-sm text-slate-600">
            Code envoyé à <strong>{email}</strong>
          </p>
          {devCode && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Mode dev — code : <strong>{devCode}</strong>
            </p>
          )}
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="123456"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-2xl tracking-widest outline-none focus:border-emerald-400"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Se connecter
          </button>
          <button
            type="button"
            className="w-full text-sm text-slate-500 hover:text-emerald-600"
            onClick={() => setStep("email")}
          >
            Changer d&apos;email
          </button>
        </form>
      )}

      {error && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
