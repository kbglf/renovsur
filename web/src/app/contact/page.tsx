"use client";

import { useState } from "react";
import { Loader2, Mail } from "lucide-react";

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          message: form.get("message"),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur");
      }
      setDone(true);
      e.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="flex items-center gap-3">
        <Mail className="h-8 w-8 text-emerald-600" />
        <h1 className="text-3xl font-bold text-slate-900">Contact</h1>
      </div>
      <p className="mt-3 text-slate-600">
        Support et partenariats : réponse sous 48h ouvrées.
      </p>

      {done ? (
        <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900">
          Message envoyé. Nous vous répondrons à l&apos;adresse indiquée.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-semibold">Nom</label>
            <input
              id="name"
              name="name"
              required
              maxLength={100}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-400"
            />
          </div>
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-semibold">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-400"
            />
          </div>
          <div>
            <label htmlFor="message" className="mb-2 block text-sm font-semibold">Message</label>
            <textarea
              id="message"
              name="message"
              required
              rows={5}
              maxLength={2000}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-400"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Envoyer
          </button>
        </form>
      )}

      <p className="mt-8 text-sm text-slate-500">
        Email direct :{" "}
        <a href="mailto:contact@renovsur.fr" className="text-emerald-600 hover:underline">
          contact@renovsur.fr
        </a>
      </p>
    </div>
  );
}
