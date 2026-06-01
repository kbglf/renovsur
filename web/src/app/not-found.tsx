import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-bold text-emerald-600">404</p>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Page introuvable</h1>
      <p className="mt-2 text-slate-600">
        Cette page n&apos;existe pas ou a été déplacée.
      </p>
      <Link
        href="/analyser"
        className="mt-8 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
      >
        Analyser un devis
      </Link>
    </div>
  );
}
