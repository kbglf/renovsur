import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "renovsur",
    storage: process.env.BLOB_READ_WRITE_TOKEN ? "vercel-blob" : "local",
    timestamp: new Date().toISOString(),
  });
}
