export const MAX_QUOTE_LENGTH = 50_000;
export const MIN_QUOTE_LENGTH = 50;

/** Anti-spam technique */
export const RATE_LIMIT_MAX = 20;
export const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

/** 1 seul aperçu gratuit à vie par appareil (pas de répétition) */
export const FREE_PREVIEW_LIFETIME = 1;
export const QUOTA_RETENTION_MS = 365 * 24 * 60 * 60 * 1000;

export const DEVICE_COOKIE = "rs_device";

export const SAMPLE_QUOTE = `Entreprise Dupont Rénovation (exemple fictif)
SIRET : 123 456 789 00012
Adresse chantier : 12 rue des Lilas, 75011 Paris
Tél : 06 12 34 56 78

DEVIS N° 2026-042 — Validité : 2 mois

Peinture murs et plafonds salon — 35 m² — 1 580 €
Enduit et préparation supports — 420 €
Fourniture peinture qualité moyenne — 280 €
Main d'œuvre peinture — 650 €

Protection sols et meubles — 120 €

Total HT : 3 050 €
TVA 10% : 305 €
Total TTC : 3 355 €

Acompte à la commande : 45%
Solde à réception des travaux

Assurance décennale n° DEC-2024-88921
Conditions de paiement : virement ou chèque`;

