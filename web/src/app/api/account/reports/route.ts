import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE, getSessionEmail } from "@/lib/auth";
import { getReportsByEmail } from "@/lib/db";
import { formatEuro, formatDate } from "@/lib/utils";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const email = await getSessionEmail(token);
  if (!email) {
    return NextResponse.json({ error: "Session expirée" }, { status: 401 });
  }

  const reports = await getReportsByEmail(email);

  return NextResponse.json({
    email,
    reports: reports.map((r) => ({
      id: r.id,
      createdAt: formatDate(r.createdAt),
      score: r.score,
      scoreLabel: r.scoreLabel,
      totalAmount: r.input.totalAmount > 0 ? formatEuro(r.input.totalAmount) : null,
      isPaid: r.isPaid,
      plan: r.plan,
      url: `/resultats/${r.id}`,
    })),
  });
}
