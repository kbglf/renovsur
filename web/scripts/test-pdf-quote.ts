import fs from "fs";
import { extractTextFromPdf } from "../src/lib/pdf-extract";
import { analyzeQuote } from "../src/lib/analyzer/index";
import { enrichReport } from "../src/lib/report-enrich";
import { countAlerts } from "../src/lib/free-tier";

const pdfPath = process.argv[2];
if (!pdfPath) {
  console.error("Usage: npx tsx scripts/test-pdf-quote.ts <path-to.pdf>");
  process.exit(1);
}

async function main() {
  const buf = fs.readFileSync(pdfPath);
  const { text, pages } = await extractTextFromPdf(buf);
  console.log("Pages:", pages, "Chars:", text.length);
  console.log("\n=== TEXTE EXTRAIT ===\n");
  console.log(text);
  console.log("\n=== ANALYSE (sans API SIRET) ===\n");

  const r = analyzeQuote({
    quoteText: text,
    region: "ile-de-france",
    totalAmount: 2450,
  });
  const c = countAlerts(r.alerts);

  console.log("Score:", r.score, "—", r.scoreLabel);
  console.log("Critiques:", c.critical, "| Vigilances:", c.warning);
  console.log("Lignes:", r.input.lines.length);
  for (const l of r.input.lines) {
    console.log(`  - ${l.description.slice(0, 70)} → ${l.total} €`);
  }
  console.log("Comparaisons:", r.priceComparisons.length);
  for (const p of r.priceComparisons) {
    console.log(
      `  - ${p.item.slice(0, 55)} | écart ${p.deviationPercent}% | ~${p.yourPrice - p.marketAverage} €`,
    );
  }
  console.log("Économies estimées:", r.totalSavingsEstimate, "€");
  console.log("SIRET:", r.input.siret ?? "(non détecté)");
  console.log("Acompte:", r.input.depositPercent ?? "(non détecté)", "%");
  console.log("\nRésumé:", r.summary);
  console.log("\nAlertes:");
  for (const a of r.alerts) {
    console.log(`  [${a.severity}] ${a.title}`);
  }
  console.log("\nConformité — échecs:");
  for (const x of r.legalChecks.filter((c) => !c.passed)) {
    console.log(`  - ${x.label}: ${x.detail.slice(0, 100)}`);
  }

  const withEnrich = process.argv.includes("--enrich");
  if (withEnrich) {
    console.log("\n=== ENRICHISSEMENT (registre + multi-SIRET) ===\n");
    await enrichReport(r, { useAi: false });
    console.log(
      "Client:",
      r.clientSiretVerification?.companyName ?? "(aucun)",
      r.input.clientSiret ?? "",
    );
    console.log(
      "Prestataire:",
      r.providerSiretVerification?.companyName ?? "(aucun)",
      r.input.providerSiret ?? "",
    );
    console.log("Résolution:", r.partyResolution?.reasoning?.join(" "));
    console.log(
      "Alertes SIRET:",
      r.alerts.filter((a) => a.id.startsWith("siret")).map((a) => a.title),
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
