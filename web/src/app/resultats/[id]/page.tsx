import { Suspense } from "react";
import { cookies } from "next/headers";
import { getReport } from "@/lib/db";
import { countAlerts, computeLegalPercent, toFreePreview } from "@/lib/free-tier";
import { verifyAndFulfillCheckout } from "@/lib/payment-verify";
import { DEVICE_COOKIE } from "@/lib/constants";
import { isValidReportId } from "@/lib/validate-id";
import { redirect } from "next/navigation";
import { ResultatsClient } from "./resultats-client";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ session_id?: string; paid?: string; cancel?: string }>;
}

export default async function ResultatsPage({ params, searchParams }: Props) {
  const { id } = await params;
  const search = await searchParams;

  if (!isValidReportId(id)) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-lg font-semibold text-slate-900">Lien de rapport invalide</p>
      </div>
    );
  }

  const cookieStore = await cookies();
  const deviceId = cookieStore.get(DEVICE_COOKIE)?.value ?? "unknown";

  let paymentNotice: "cancel" | "error" | null = null;

  if (search.cancel === "1") {
    paymentNotice = "cancel";
  } else if (search.session_id) {
    const verified = await verifyAndFulfillCheckout(id, search.session_id, deviceId);
    if (verified.ok && verified.redirect) {
      redirect(verified.redirect);
    }
    if (!verified.ok) {
      paymentNotice = "error";
    }
  }

  const report = await getReport(id);
  const full = report;
  const display = full ? (full.isPaid ? full : toFreePreview(full)) : null;

  return (
    <Suspense fallback={<div className="py-20 text-center text-slate-500">Chargement…</div>}>
      <ResultatsClient
        reportId={id}
        initialReport={display}
        alertCounts={full ? countAlerts(full.alerts) : undefined}
        legalScorePercent={full ? computeLegalPercent(full.legalChecks) : undefined}
        realSavings={full?.isPaid ? full.totalSavingsEstimate : undefined}
        showPaidSuccess={search.paid === "1" && Boolean(full?.isPaid)}
        paymentNotice={paymentNotice}
      />
    </Suspense>
  );
}
