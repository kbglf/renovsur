import { getLegalField } from "@/lib/env";

export function LegalPublisherBlock() {
  const company = getLegalField("company");
  const siret = getLegalField("siret");
  const address = getLegalField("address");
  const director = getLegalField("director");

  const complete = company && siret && address && director;

  if (complete) {
    return (
      <>
        <p>
          <strong>Éditeur :</strong> {company} — SIRET {siret}
          <br />
          {address}
        </p>
        <p>
          <strong>Directeur de publication :</strong> {director}
        </p>
      </>
    );
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm not-prose">
      <p className="font-semibold text-amber-950">Informations légales à compléter avant mise en ligne</p>
      <p className="mt-2 text-amber-900/90">
        Renseignez dans les variables d&apos;environnement :{" "}
        <code className="text-xs">LEGAL_COMPANY_NAME</code>,{" "}
        <code className="text-xs">LEGAL_SIRET</code>,{" "}
        <code className="text-xs">LEGAL_ADDRESS</code>,{" "}
        <code className="text-xs">LEGAL_DIRECTOR</code>.
      </p>
      <p className="mt-2 text-amber-900/80">
        En attendant : contact@renovsur.fr
      </p>
    </div>
  );
}
