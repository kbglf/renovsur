export function HomeJsonLd() {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://renovsur.fr";
  const data = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "RénovSûr",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: [
      {
        "@type": "Offer",
        price: "0",
        priceCurrency: "EUR",
        name: "Aperçu gratuit",
        description: "Score et compteurs d'alertes — une fois par appareil",
      },
      {
        "@type": "Offer",
        price: "19",
        priceCurrency: "EUR",
        name: "Rapport Essentiel",
      },
      {
        "@type": "Offer",
        price: "39",
        priceCurrency: "EUR",
        name: "Rapport Négociation",
      },
    ],
    description:
      "Plateforme française d'analyse de devis travaux : détection arnaques, conformité légale, comparaison prix.",
    url: base,
    inLanguage: "fr-FR",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
