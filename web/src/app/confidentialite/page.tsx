export const metadata = { title: "Politique de confidentialité" };

export default function ConfidentialitePage() {
  return (
    <div className="prose prose-slate mx-auto max-w-3xl px-4 py-16">
      <h1>Politique de confidentialité (RGPD)</h1>
      <h2>Données collectées</h2>
      <p>
        Texte des devis analysés, fichiers PDF uploadés (traités pour extraction de texte),
        identifiant appareil (cookie), adresse IP pour la limitation d&apos;abus, email si
        fourni, données de paiement traitées par Stripe (nous ne stockons pas vos coordonnées
        bancaires).
      </p>
      <h2>Cookies</h2>
      <p>
        Cookies essentiels uniquement (session compte, appareil pour quota d&apos;aperçu gratuit).
        Aucun cookie publicitaire ni traceur tiers à ce jour.
      </p>
      <h2>Finalité</h2>
      <p>Analyse de devis et amélioration du service. Aucune revente de données.</p>
      <h2>Conservation</h2>
      <p>Rapports conservés 12 mois maximum, puis suppression.</p>
      <h2>Vos droits</h2>
      <p>Accès, rectification, suppression : contact@renovsur.fr</p>
      <h2>Hébergement</h2>
      <p>Données hébergées dans l&apos;Union Européenne.</p>
    </div>
  );
}
