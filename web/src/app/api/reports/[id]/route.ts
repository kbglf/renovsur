import { NextRequest } from "next/server";
import { getReport } from "@/lib/db";
import { toFreePreview, countAlerts, computeLegalPercent } from "@/lib/free-tier";
import { jsonWithCors, optionsResponse } from "@/lib/cors";
import { isValidReportId } from "@/lib/validate-id";

export async function OPTIONS(req: NextRequest) {
  return optionsResponse(req.headers.get("origin"));
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const origin = req.headers.get("origin");
  const { id } = await params;

  if (!isValidReportId(id)) {
    return jsonWithCors({ error: "Identifiant invalide" }, origin, { status: 400 });
  }

  const report = await getReport(id);

  if (!report) {
    return jsonWithCors({ error: "Rapport introuvable" }, origin, { status: 404 });
  }

  if (report.isPaid) {
    return jsonWithCors(report, origin);
  }

  const full = report;
  return jsonWithCors(
    {
      ...toFreePreview(full),
      alertCounts: countAlerts(full.alerts),
      legalScorePercent: computeLegalPercent(full.legalChecks),
      requiresPayment: true,
    },
    origin,
  );
}
