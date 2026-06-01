import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Header, Footer } from "@/components/layout";
import { CookieBanner } from "@/components/cookie-banner";
import { HomeJsonLd } from "@/components/json-ld";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://renovsur.fr";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "RénovSûr — Analysez votre devis travaux avant de signer",
    template: "%s | RénovSûr",
  },
  description:
    "Détectez les arnaques, vérifiez la conformité légale et comparez les prix de votre devis travaux. Outil français pour propriétaires. Analyse gratuite.",
  keywords: [
    "analyse devis travaux",
    "arnaque artisan",
    "vérifier devis rénovation",
    "prix travaux France",
    "devis BTP",
  ],
  robots: { index: true, follow: true },
  openGraph: {
    title: "RénovSûr — Ne signez plus un mauvais devis",
    description: "Analyse intelligente de devis travaux pour propriétaires français.",
    locale: "fr_FR",
    type: "website",
    url: appUrl,
    siteName: "RénovSûr",
  },
  twitter: {
    card: "summary_large_image",
    title: "RénovSûr — Analyse de devis travaux",
    description: "Analyse gratuite : arnaques, légal, prix régionaux.",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${geist.variable} h-full`}>
      <head>
        <HomeJsonLd />
      </head>
      <body className="flex min-h-full flex-col antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <CookieBanner />
      </body>
    </html>
  );
}
