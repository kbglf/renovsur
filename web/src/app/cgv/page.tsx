export const metadata = { title: "Conditions générales de vente" };

export default function CGVPage() {
  return (
    <div className="prose prose-slate mx-auto max-w-3xl px-4 py-16">
      <h1>Conditions générales de vente</h1>

      <h2>Produits (paiement unique, TTC)</h2>
      <ul>
        <li>
          <strong>Rapport Essentiel</strong> — 19 € : alertes détaillées, prix marché, checklist
          légale
        </li>
        <li>
          <strong>Rapport Négociation</strong> — 39 € : Essentiel + lettre et leviers de
          négociation
        </li>
        <li>
          <strong>Pack Comparer 3 devis</strong> — 49 € : 3 rapports Essentiel (crédits sur
          l&apos;appareil)
        </li>
      </ul>

      <h2>Paiement et accès</h2>
      <p>
        Paiement sécurisé par carte via Stripe. Le rapport est accessible immédiatement après
        confirmation du paiement (lien web + email si fourni).
      </p>

      <h2>Contenu numérique</h2>
      <p>
        Les rapports sont des contenus numériques fournis sans support physique. En validant
        votre commande, vous demandez la fourniture immédiate et renoncez au délai de
        rétractation une fois le rapport délivré (art. L221-28 Code de la consommation).
      </p>

      <h2>Remboursement</h2>
      <p>
        Aucun remboursement systématique n&apos;est proposé après délivrance du rapport. En cas
        de dysfonctionnement technique empêchant l&apos;accès au rapport payé, contactez{" "}
        <a href="mailto:contact@renovsur.fr">contact@renovsur.fr</a> sous 7 jours avec votre
        email de commande.
      </p>

      <h2>Support</h2>
      <p>
        Assistance technique : contact@renovsur.fr (réponse sous 48 h ouvrées en moyenne).
      </p>

      <h2>Limitation de responsabilité</h2>
      <p>
        Les analyses sont indicatives et ne constituent pas un avis juridique ni un diagnostic
        de chantier. RénovSûr n&apos;est pas responsable des décisions prises sur la base des
        rapports.
      </p>
    </div>
  );
}
