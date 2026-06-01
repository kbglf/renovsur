import { Suspense } from "react";
import { cookies } from "next/headers";
import { getReport } from "@/lib/db";
import { countAlerts, computeLegalPercent, toFreePreview } from "@/lib/free-tier";
import { verifyAndFulfillCheckout } from "@/lib/payment-verify";
import { DEVICE_COOKIE } from "@/lib/constants";
import { notFound, redirect } from "next/navigation";
import { ResultatsClient } from "./resultats-client";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ session_id?: string; paid?: string; cancel?: string }>;
}

export default async function ResultatsPage({ params, searchParams }: Props) {
  const { id } = await params;
  const search = await searchParams;
  const cookieStore = await cookies();
  const deviceId = cookieStore.get(DEVICE_COOKIE)?.value ?? "unknown";

  let report = await getReport(id);
  if (!report) notFound();

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

  const full = (await getReport(id)) ?? report;
  const display = full.isPaid ? full : toFreePreview(full);

  return (
    <Suspense fallback={<div className="py-20 text-center text-slate-500">Chargement…</div>}>
      <ResultatsClient
        initialReport={display}
        alertCounts={countAlerts(full.alerts)}
        legalScorePercent={computeLegalPercent(full.legalChecks)}
        realSavings={full.isPaid ? full.totalSavingsEstimate : undefined}
        showPaidSuccess={search.paid === "1" && full.isPaid}
        paymentNotice={paymentNotice}
      />
    </Suspense>
  );
}
