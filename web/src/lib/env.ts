/** DEMO_MODE ignoré en production — évite un déblocage gratuit accidentel */
export function isDemoMode(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return process.env.DEMO_MODE === "true";
}

export function getAuthSecret(): Uint8Array {
  const raw = process.env.AUTH_SECRET;
  if (process.env.NODE_ENV === "production") {
    if (!raw || raw.length < 32) {
      throw new Error("AUTH_SECRET manquant ou trop court (min. 32 caractères en production)");
    }
    return new TextEncoder().encode(raw);
  }
  return new TextEncoder().encode(
    raw ?? "dev-only-change-in-production-min-32-chars!!",
  );
}

export function getLegalField(
  key: "company" | "siret" | "address" | "director",
): string | null {
  const map = {
    company: process.env.LEGAL_COMPANY_NAME,
    siret: process.env.LEGAL_SIRET,
    address: process.env.LEGAL_ADDRESS,
    director: process.env.LEGAL_DIRECTOR,
  };
  const v = map[key]?.trim();
  return v || null;
}
