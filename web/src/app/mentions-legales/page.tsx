import { LegalPublisherBlock } from "@/components/legal-notice";

export const metadata = { title: "Mentions légales" };

export default function MentionsLegalesPage() {
  return (
    <div className="prose prose-slate mx-auto max-w-3xl px-4 py-16">
      <h1>Mentions légales</h1>
      <LegalPublisherBlock />
      <p>
        <strong>Contact :</strong>{" "}
        <a href="mailto:contact@renovsur.fr">contact@renovsur.fr</a>
      </p>
      <p>
        <strong>Hébergement :</strong> Vercel Inc. — traitement des données dans l&apos;Union
        Européenne lorsque disponible.
      </p>
      <p>
        RénovSûr fournit des analyses indicatives à titre informatif. Ce service ne remplace
        pas un avis juridique ou un expert BTP qualifié.
      </p>
    </div>
  );
}
