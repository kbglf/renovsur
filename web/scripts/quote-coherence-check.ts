/**
 * Batterie de devis fictifs — vérifie la cohérence des rapports (sans API réseau).
 * Usage: npx tsx scripts/quote-coherence-check.ts
 */
import { analyzeQuote } from "../src/lib/analyzer/index";
import { applyCompanyRegistryVerification } from "../src/lib/siret-enrich";
import { countAlerts } from "../src/lib/free-tier";
import type { AnalysisResult } from "../src/lib/types";
import type { CompanyRegistryBundle } from "../src/lib/registry-verify";

interface Fixture {
  id: string;
  label: string;
  quoteText: string;
  input?: {
    region?: "ile-de-france" | "autre";
    surfaceM2?: number;
    totalAmount?: number;
    depositPercent?: number;
  };
  registry?: CompanyRegistryBundle;
  expect: {
    minCritical?: number;
    maxCritical?: number;
    minWarning?: number;
    maxWarning?: number;
    minComparisons?: number;
    maxComparisons?: number;
    minScore?: number;
    maxScore?: number;
    mustHaveSavings?: boolean;
    noSavings?: boolean;
    summaryMustMentionCritical?: boolean;
  };
}

const now = new Date().toISOString();

function mockRegistry(
  siretStatus: CompanyRegistryBundle["siret"]["status"],
  siret = "73282932000074",
): CompanyRegistryBundle {
  const active = siretStatus === "active";
  return {
    siret: {
      siret,
      status: siretStatus,
      isActive: active,
      companyName: active ? "SARL Bâtiment Pro (fictif)" : undefined,
      verifiedAt: now,
      registryUrl: "https://annuaire-entreprises.data.gouv.fr",
      summary:
        siretStatus === "active"
          ? "SIRET actif (test fictif)."
          : siretStatus === "invalid"
            ? "SIRET invalide (test fictif)."
            : "SIRET introuvable (test fictif).",
    },
    rge: {
      required: false,
      status: "not_required",
      certificationCodes: [],
      summary: "RGE non requis pour ce chantier (test).",
      annuaireUrl: "https://france-renov.gouv.fr/annuaire-professionnels",
    },
    decennale: {
      required: true,
      status: "mentioned",
      mentionedInQuote: true,
      summary: "Décennale mentionnée (test).",
      guideUrl: "https://www.service-public.fr/particuliers/vosdroits/F35741",
    },
  };
}

function buildReport(
  fixture: Fixture,
): AnalysisResult {
  const report = analyzeQuote({
    quoteText: fixture.quoteText,
    region: fixture.input?.region ?? "ile-de-france",
    surfaceM2: fixture.input?.surfaceM2,
    totalAmount: fixture.input?.totalAmount,
    depositPercent: fixture.input?.depositPercent,
  });
  if (fixture.registry) {
    applyCompanyRegistryVerification(report, fixture.registry);
  }
  return report;
}

function criticalInSummary(summary: string): number | null {
  const m = summary.match(/(\d+)\s+point\(s\)\s+critique/i);
  return m ? parseInt(m[1], 10) : null;
}

function warningInSummary(summary: string): number | null {
  const m = summary.match(/(\d+)\s+point\(s\)\s+de\s+vigilance/i);
  return m ? parseInt(m[1], 10) : null;
}

const FIXTURES: Fixture[] = [
  {
    id: "good-peinture",
    label: "Bon devis peinture (prix raisonnable, acompte 30 %)",
    quoteText: `Artisan Martin Peinture
SIRET : 732 829 320 00074
12 rue des Lilas, 75011 Paris

Peinture chambre — 28 m² — 750 €
Protection et lessivage — 180 €

Total HT : 930 €
TVA 10% : 93 €
Total TTC : 1 023 €

Acompte à la commande : 30%
Assurance décennale n° DEC-2025-001`,
    registry: mockRegistry("active"),
    expect: {
      maxCritical: 0,
      maxComparisons: 1,
      minScore: 55,
      maxScore: 100,
      noSavings: true,
    },
  },
  {
    id: "bad-sample-like",
    label: "Mauvais devis (SIRET invalide, acompte 45 %, peinture chère)",
    quoteText: `Entreprise Dupont Rénovation
SIRET : 123 456 789 00012

Peinture murs salon — 35 m² — 1 580 €
Enduit — 420 €

Total HT : 2 000 €
Total TTC : 2 200 €

Acompte : 45%
Assurance décennale DEC-2024-88921`,
    registry: mockRegistry("invalid", "12345678900012"),
    expect: {
      minCritical: 1,
      minWarning: 1,
      minComparisons: 1,
      maxScore: 40,
      mustHaveSavings: true,
      summaryMustMentionCritical: true,
    },
  },
  {
    id: "bad-scam-patterns",
    label: "Arnaque type (espèces, urgence, forfait opaque)",
    quoteText: `Devis urgent — offre limitée 24h
Paiement espèces uniquement sans facture
Forfait tout compris sans détail : 8 500 €
Acompte 60% à la signature`,
    expect: {
      minCritical: 2,
      maxScore: 35,
    },
  },
  {
    id: "bad-deposit-55",
    label: "Acompte 55 % (critique)",
    quoteText: `Rénovation SARL Test
Peinture — 20 m² — 600 €
Total TTC : 660 €
Acompte : 55%`,
    expect: {
      minCritical: 1,
      maxScore: 50,
    },
  },
  {
    id: "edge-no-surface",
    label: "Sans m² — pas de comparaison prix",
    quoteText: `Plomberie complète salle de bain — 2 400 €
Dépose ancien équipement — 350 €
Total TTC : 2 750 €
Acompte 25%`,
    input: { region: "autre" },
    expect: {
      maxComparisons: 0,
      noSavings: true,
    },
  },
  {
    id: "edge-m2-ascii",
    label: "Surface en m2 (ASCII) — comparaison doit marcher",
    quoteText: `Peinture séjour — 40 m2 — 2 200 €
Total TTC : 2 420 €`,
    expect: {
      minComparisons: 1,
      mustHaveSavings: true,
    },
  },
  {
    id: "edge-m2-unicode",
    label: "Surface en m² (Unicode) — comparaison doit marcher",
    quoteText: `Peinture séjour — 40 m² — 2 200 €
Total TTC : 2 420 €`,
    expect: {
      minComparisons: 1,
      mustHaveSavings: true,
    },
  },
  {
    id: "edge-totals-french",
    label: "Montants avec espaces (1 862 €)",
    quoteText: `Carrelage salle de bain — 12 m² — 540 €
Total HT : 1 862 €
Total TTC : 2 048 €`,
    input: { totalAmount: 2048 },
    expect: {
      minComparisons: 0,
      maxComparisons: 1,
    },
  },
  {
    id: "good-carrelage-fair",
    label: "Carrelage prix proche du marché",
    quoteText: `Pose carrelage cuisine — 15 m² — 720 €
Total TTC : 792 €
Acompte 30%`,
    expect: {
      maxComparisons: 1,
      maxScore: 100,
    },
  },
  {
    id: "bad-siret-not-found",
    label: "SIRET introuvable au registre",
    quoteText: `Entreprise Fantôme
SIRET : 999 999 999 99999
Peinture — 25 m² — 1 100 €
Total TTC : 1 210 €`,
    registry: mockRegistry("not_found", "99999999999999"),
    expect: {
      minCritical: 1,
      summaryMustMentionCritical: true,
    },
  },
];

type Issue = { fixture: string; rule: string; detail: string };

function checkInvariants(report: AnalysisResult, fixtureId: string): Issue[] {
  const issues: Issue[] = [];
  const counts = countAlerts(report.alerts);

  if (counts.critical !== report.alerts.filter((a) => a.severity === "critical").length) {
    issues.push({
      fixture: fixtureId,
      rule: "countAlerts.critical",
      detail: `Incohérence compteur critiques (${counts.critical})`,
    });
  }

  const summaryCrit = criticalInSummary(report.summary);
  const summaryWarn = warningInSummary(report.summary);
  if (summaryCrit !== null && summaryCrit !== counts.critical) {
    issues.push({
      fixture: fixtureId,
      rule: "summary vs alerts (critical)",
      detail: `Résumé dit ${summaryCrit} critique(s), alertes en ont ${counts.critical}`,
    });
  }
  if (summaryWarn !== null && summaryWarn !== counts.warning) {
    issues.push({
      fixture: fixtureId,
      rule: "summary vs alerts (warning)",
      detail: `Résumé dit ${summaryWarn} vigilance(s), alertes en ont ${counts.warning}`,
    });
  }

  if (report.totalSavingsEstimate > report.input.totalAmount && report.input.totalAmount > 0) {
    issues.push({
      fixture: fixtureId,
      rule: "savings <= total",
      detail: `Économies ${report.totalSavingsEstimate} > TTC ${report.input.totalAmount}`,
    });
  }

  for (const c of report.priceComparisons) {
    if (c.scope === "line_total" && c.quantity && c.yourUnitPrice) {
      const expected = Math.round(c.yourPrice / c.quantity);
      if (Math.abs(expected - c.yourUnitPrice) > 2) {
        issues.push({
          fixture: fixtureId,
          rule: "unit price math",
          detail: `${c.item}: yourUnitPrice ${c.yourUnitPrice} vs ${c.yourPrice}/${c.quantity}=${expected}`,
        });
      }
    }
    const lineSavings = c.yourPrice - c.marketAverage;
    if (c.status !== "ok" && lineSavings > 0) {
      const saved = Math.min(lineSavings, c.yourPrice);
      if (saved > report.input.totalAmount && report.input.totalAmount > 0) {
        issues.push({
          fixture: fixtureId,
          rule: "line savings absurd",
          detail: `Économie ligne ${saved} > total devis`,
        });
      }
    }
  }

  if (report.score < 0 || report.score > 100) {
    issues.push({
      fixture: fixtureId,
      rule: "score bounds",
      detail: `Score hors 0-100: ${report.score}`,
    });
  }

  const labelForScore =
    report.score >= 80
      ? "fiable"
      : report.score >= 60
        ? "vigilance"
        : report.score >= 40
          ? "modéré"
          : "rouge";
  if (report.score < 40 && !report.scoreLabel.toLowerCase().includes("rouge")) {
    issues.push({
      fixture: fixtureId,
      rule: "score label",
      detail: `Score ${report.score} mais label « ${report.scoreLabel} »`,
    });
  }
  if (report.score >= 80 && labelForScore !== "fiable") {
    issues.push({
      fixture: fixtureId,
      rule: "score label high",
      detail: `Score ${report.score} / label ${report.scoreLabel}`,
    });
  }

  return issues;
}

function checkExpectations(
  report: AnalysisResult,
  fixture: Fixture,
): Issue[] {
  const issues: Issue[] = [];
  const counts = countAlerts(report.alerts);
  const e = fixture.expect;

  if (e.minCritical !== undefined && counts.critical < e.minCritical) {
    issues.push({
      fixture: fixture.id,
      rule: "expect minCritical",
      detail: `Attendu ≥${e.minCritical}, obtenu ${counts.critical}`,
    });
  }
  if (e.maxCritical !== undefined && counts.critical > e.maxCritical) {
    issues.push({
      fixture: fixture.id,
      rule: "expect maxCritical",
      detail: `Attendu ≤${e.maxCritical}, obtenu ${counts.critical}`,
    });
  }
  if (e.minWarning !== undefined && counts.warning < e.minWarning) {
    issues.push({
      fixture: fixture.id,
      rule: "expect minWarning",
      detail: `Attendu ≥${e.minWarning}, obtenu ${counts.warning}`,
    });
  }
  if (e.minComparisons !== undefined && report.priceComparisons.length < e.minComparisons) {
    issues.push({
      fixture: fixture.id,
      rule: "expect minComparisons",
      detail: `Attendu ≥${e.minComparisons}, obtenu ${report.priceComparisons.length}`,
    });
  }
  if (e.maxComparisons !== undefined && report.priceComparisons.length > e.maxComparisons) {
    issues.push({
      fixture: fixture.id,
      rule: "expect maxComparisons",
      detail: `Attendu ≤${e.maxComparisons}, obtenu ${report.priceComparisons.length}`,
    });
  }
  if (e.minScore !== undefined && report.score < e.minScore) {
    issues.push({
      fixture: fixture.id,
      rule: "expect minScore",
      detail: `Attendu ≥${e.minScore}, obtenu ${report.score}`,
    });
  }
  if (e.maxScore !== undefined && report.score > e.maxScore) {
    issues.push({
      fixture: fixture.id,
      rule: "expect maxScore",
      detail: `Attendu ≤${e.maxScore}, obtenu ${report.score}`,
    });
  }
  if (e.mustHaveSavings && report.totalSavingsEstimate <= 0) {
    issues.push({
      fixture: fixture.id,
      rule: "expect savings",
      detail: "Économies attendues > 0",
    });
  }
  if (e.noSavings && report.totalSavingsEstimate > 0) {
    issues.push({
      fixture: fixture.id,
      rule: "expect no savings",
      detail: `Économies inattendues: ${report.totalSavingsEstimate}`,
    });
  }
  if (e.summaryMustMentionCritical) {
    const n = criticalInSummary(report.summary);
    if (n === null || n < 1) {
      issues.push({
        fixture: fixture.id,
        rule: "summary critical text",
        detail: `Résumé sans critique: « ${report.summary.slice(0, 80)}… »`,
      });
    }
  }

  return issues;
}

console.log("=== Batterie de cohérence RénovSûr ===\n");

const allIssues: Issue[] = [];
const rows: string[] = [];

for (const fixture of FIXTURES) {
  const report = buildReport(fixture);
  const counts = countAlerts(report.alerts);
  const inv = checkInvariants(report, fixture.id);
  const exp = checkExpectations(report, fixture);
  const issues = [...inv, ...exp];
  allIssues.push(...issues);

  const status = issues.length === 0 ? "OK" : "FAIL";
  rows.push(
    `[${status}] ${fixture.id}\n` +
      `  ${fixture.label}\n` +
      `  Score ${report.score} (${report.scoreLabel}) | ${counts.critical} crit. ${counts.warning} vig. | ` +
      `${report.priceComparisons.length} comparaison(s) | économies ${report.totalSavingsEstimate} €\n` +
      `  Résumé: ${report.summary.slice(0, 100)}…`,
  );
  if (issues.length > 0) {
    for (const i of issues) {
      rows.push(`  ✗ ${i.rule}: ${i.detail}`);
    }
  }
}

console.log(rows.join("\n\n"));
console.log("\n=== Bilan ===");
console.log(
  allIssues.length === 0
    ? `✅ ${FIXTURES.length}/${FIXTURES.length} scénarios cohérents`
    : `❌ ${allIssues.length} problème(s) sur ${FIXTURES.length} scénarios`,
);

process.exit(allIssues.length > 0 ? 1 : 0);
