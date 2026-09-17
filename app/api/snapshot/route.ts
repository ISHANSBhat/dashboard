import { NextResponse } from "next/server";
import { getDashboardSnapshot } from "@/lib/influxdb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshot = await getDashboardSnapshot();
    return NextResponse.json(snapshot, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("snapshot error:", err);
    return NextResponse.json(
      { error: "Failed to query InfluxDB" },
      { status: 502 },
    );
  }
}