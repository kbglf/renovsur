import { CompteClient } from "@/components/compte-client";

export const metadata = {
  title: "Mon compte — Mes rapports",
  description: "Retrouvez vos analyses de devis RénovSûr par email.",
};

export default function ComptePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <CompteClient />
    </div>
  );
}
