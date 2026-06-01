"use client";

import Link from "next/link";
import { ShieldCheck, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/analyser", label: "Analyser" },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/compte", label: "Mon compte" },
  { href: "/faq", label: "FAQ" },
  { href: "/blog", label: "Guides" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-emerald-100/60 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-emerald-950">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <span className="text-lg tracking-tight">
            Rénov<span className="text-emerald-600">Sûr</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-slate-600 transition hover:text-emerald-700"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/analyser"
            className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            Analyser gratuitement
          </Link>
        </nav>

        <button
          type="button"
          className="md:hidden rounded-lg p-2 text-slate-600"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-emerald-50 bg-white px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-emerald-50"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/analyser"
              className="mt-2 rounded-full bg-emerald-600 px-5 py-3 text-center text-sm font-semibold text-white"
              onClick={() => setOpen(false)}
            >
              Analyser gratuitement
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-950 text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 text-white">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
            <span className="text-lg font-semibold">RénovSûr</span>
          </div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
            Analysez vos devis travaux avant de signer. Détection d&apos;arnaques,
            vérification légale et comparaison de prix — conçu pour les
            propriétaires français.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-white">Produit</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/analyser" className="hover:text-emerald-400">Analyser un devis</Link></li>
            <li><Link href="/tarifs" className="hover:text-emerald-400">Tarifs</Link></li>
            <li><Link href="/blog" className="hover:text-emerald-400">Guides travaux</Link></li>
            <li><Link href="/faq" className="hover:text-emerald-400">FAQ</Link></li>
            <li><Link href="/contact" className="hover:text-emerald-400">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-white">Légal</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/mentions-legales" className="hover:text-emerald-400">Mentions légales</Link></li>
            <li><Link href="/confidentialite" className="hover:text-emerald-400">Confidentialité</Link></li>
            <li><Link href="/cgv" className="hover:text-emerald-400">CGV</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} RénovSûr — Données hébergées en Union Européenne (RGPD)
      </div>
    </footer>
  );
}
