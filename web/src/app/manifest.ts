import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RénovSûr — Analyse de devis travaux",
    short_name: "RénovSûr",
    description: "Analysez vos devis travaux avant de signer",
    start_url: "/",
    display: "standalone",
    background_color: "#f8faf9",
    theme_color: "#059669",
    lang: "fr",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
