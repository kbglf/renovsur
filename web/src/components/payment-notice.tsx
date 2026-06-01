import { AlertCircle, XCircle } from "lucide-react";
import Link from "next/link";

type Variant = "cancel" | "error";

const COPY: Record<
  Variant,
  { title: string; body: string; cta?: { href: string; label: string } }
> = {
  cancel: {
    title: "Paiement annulé",
    body: "Aucun montant n'a été débité. Vous pouvez réessayer quand vous le souhaitez.",
    cta: { href: "/tarifs", label: "Voir les tarifs" },
  },
  error: {
    title: "Paiement non confirmé",
    body: "La vérification Stripe a échoué. Si vous avez été débité, contactez-nous avec votre email de paiement.",
    cta: { href: "/contact", label: "Nous contacter" },
  },
};

export function PaymentNotice({ variant }: { variant: Variant }) {
  const copy = COPY[variant];
  const Icon = variant === "cancel" ? XCircle : AlertCircle;

  return (
    <div
      role="alert"
      className="mb-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-950"
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="text-sm">
        <p className="font-semibold">{copy.title}</p>
        <p className="mt-1 text-amber-900/90">{copy.body}</p>
        {copy.cta && (
          <Link
            href={copy.cta.href}
            className="mt-2 inline-block font-medium text-emerald-700 underline hover:text-emerald-800"
          >
            {copy.cta.label} →
          </Link>
        )}
      </div>
    </div>
  );
}
