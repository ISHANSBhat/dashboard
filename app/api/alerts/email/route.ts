import { NextResponse } from "next/server";
import { getDashboardSnapshot, queryAlerts } from "@/lib/influxdb";
import { sendEmail, emailStatus } from "@/lib/resend";
import { alertHtml, alertText, alertKey, alertSubject, pendingAlerts } from "@/lib/alert-email";
import { readSentAlerts, recordSentAlerts, pruneSentAlerts } from "@/lib/email-state";

export const dynamic = "force-dynamic";

// Alerts can sit unresolved for a long time, and a still-open alert from last
// week is exactly what you want to know about. Overridable for testing.
const RANGE = process.env.ALERT_EMAIL_RANGE ?? "-30d";

/**
 * GET — reports whether alerting is wired up and how many alerts are waiting,
 * so the dashboard can grey the button out instead of failing on click.
 */
export async function GET() {
  try {
    const status = emailStatus();
    const alerts = await queryAlerts(RANGE).catch(() => []);
    const sent = await readSentAlerts();

    const pending = pendingAlerts(alerts, sent);

    return NextResponse.json(
      {
        ...status,
        pending: pending.length,
        openAlerts: alerts.filter((a) => a.resolutionStatus === "Unresolved").length,
        window: RANGE,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("email status error:", err);
    return NextResponse.json({ error: "Failed to read alert state" }, { status: 502 });
  }
}

/**
 * POST — sends the pending open alerts.
 *
 * Body: `{ force?: boolean }` — `force` re-sends everything currently open,
 * ignoring the sent-state file. That is what the "Send test" button uses so you
 * can confirm delivery without waiting for a fresh violation.
 */
export async function POST(request: Request) {
  const status = emailStatus();
  if (!status.configured) {
    return NextResponse.json(
      { error: "Email alerting is not configured", missing: status.missing },
      { status: 503 },
    );
  }

  let force = false;
  try {
    const body = (await request.json().catch(() => ({}))) as { force?: boolean };
    force = body.force === true;
  } catch {
    // Empty body is fine; defaults to force=false.
  }

  try {
    const [alerts, snapshot, sent] = await Promise.all([
      queryAlerts(RANGE),
      getDashboardSnapshot().catch(() => null),
      readSentAlerts(),
    ]);

    const candidates = alerts.filter((a) => a.resolutionStatus === "Unresolved");
    const batch = force ? candidates : pendingAlerts(alerts, sent);

    if (batch.length === 0) {
      return NextResponse.json({ sent: 0, message: "No new open alerts to email" });
    }

    const result = await sendEmail({
      to: [status.to],
      subject: `${force ? "[TEST] " : ""}${alertSubject(batch, snapshot)}`,
      html: alertHtml(batch, snapshot, status.dashboardUrl),
      text: alertText(batch, snapshot, status.dashboardUrl),
    });

    // Only now is it safe to mark these as emailed — a failed send must retry.
    if (!force) {
      await recordSentAlerts(batch.map(alertKey));
    }

    // Forget alerts that have since been resolved so the state file stays small.
    const resolved = alerts
      .filter((a) => a.resolutionStatus !== "Unresolved")
      .map(alertKey);
    await pruneSentAlerts(resolved).catch(() => {});

    return NextResponse.json({
      sent: batch.length,
      id: result.id,
      dryRun: status.dryRun,
    });
  } catch (err) {
    console.error("alert email error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
