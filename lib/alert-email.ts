/**
 * Cold-chain alert emails.
 *
 * Template + subject rules live here so both the route handler and the manual
 * "send test" button render the same message.
 *
 * Layout is inline-styled tables: email clients strip <style> blocks in some
 * clients and ignore flexbox, so nothing here depends on either.
 */

import type { AlertRecord, DashboardSnapshot } from "@/types";
import { formatDateTime } from "@/lib/format";

/** Only these are emailed; the dashboard shows more detail. */
export const MAX_ALERTS_IN_EMAIL = 20;

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function countUnsent(alerts: AlertRecord[], sent: Set<string>): number {
  return alerts.filter((a) => a.resolutionStatus === "Unresolved" && !sent.has(alertKey(a))).length;
}

export function alertKey(a: AlertRecord): string {
  return `${a.alertId}|${a.time}`;
}

export function pendingAlerts(
  alerts: AlertRecord[],
  sent: Set<string>,
  limit = MAX_ALERTS_IN_EMAIL,
): AlertRecord[] {
  return alerts
    .filter((a) => a.resolutionStatus === "Unresolved" && !sent.has(alertKey(a)))
    .slice(0, limit);
}

export function alertSubject(alerts: AlertRecord[], snapshot: DashboardSnapshot | null): string {
  if (alerts.length === 0) return "Cold chain alert test · ColdChain Monitor";
  const heat = alerts.filter((a) => /heat|degradation/i.test(a.alertType)).length;
  const cold = alerts.filter((a) => /cold|freeze/i.test(a.alertType)).length;
  const parts = [`${alerts.length} cold-chain alert${alerts.length === 1 ? "" : "s"}`];
  if (heat) parts.push(`${heat} heat/degradation`);
  if (cold) parts.push(`${cold} cold/freeze`);
  const batch = snapshot?.vaccine?.batchNumber;
  return batch ? `${parts.join(" · ")} — batch ${batch}` : parts.join(" · ");
}

function severityOf(type: string): { label: string; bg: string; fg: string } {
  if (/degradation/i.test(type)) return { label: "Degradation", bg: "#7f1d1d", fg: "#fee2e2" };
  if (/freeze|cold/i.test(type)) return { label: "Cold", bg: "#1e3a5f", fg: "#dbeafe" };
  return { label: "Heat", bg: "#78350f", fg: "#fef3c7" };
}

export function alertText(
  alerts: AlertRecord[],
  snapshot: DashboardSnapshot | null,
  dashboardUrl: string,
): string {
  const lines: string[] = [];
  lines.push(alertSubject(alerts, snapshot));
  lines.push("");

  if (snapshot?.latestReading) {
    const r = snapshot.latestReading;
    const v = snapshot.vaccine;
    const band = v ? `${v.minStorageTemp}-${v.maxStorageTemp}C` : "unknown";
    lines.push(
      `Current: ${r.temperature.toFixed(1)}C (safe band ${band}), humidity ${r.humidity.toFixed(0)}%`,
    );
    lines.push(`Location: ${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)}`);
  }

  if (snapshot) {
    lines.push(
      `Degradation index: ${(snapshot.degradationIndex * 100).toFixed(1)}% ` +
        `(${snapshot.cumulativeHeatHours.toFixed(2)}h cumulative heat)`,
    );
    lines.push(`Storage uptime: ${snapshot.uptimePercent}%`);
  }

  if (alerts.length) {
    lines.push("");
    lines.push("Open alerts:");
    for (const a of alerts) {
      lines.push(
        `- [${a.alertType}] ${formatDateTime(a.time)} · batch ${a.batchNumber} · unit ${a.unitId}: ${a.details}`,
      );
    }
  }

  lines.push("");
  lines.push(`Dashboard: ${dashboardUrl}/alerts`);
  return lines.join("\n");
}

export function alertHtml(
  alerts: AlertRecord[],
  snapshot: DashboardSnapshot | null,
  dashboardUrl: string,
): string {
  const rows = alerts
    .map((a) => {
      const sev = severityOf(a.alertType);
      return `      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #262626;white-space:nowrap;color:#a1a1a1;font-size:12px;">${escapeHtml(
          formatDateTime(a.time),
        )}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #262626;">
          <span style="display:inline-block;padding:2px 8px;border-radius:999px;background:${sev.bg};color:${sev.fg};font-size:11px;font-weight:600;">${escapeHtml(
            sev.label,
          )}</span>
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #262626;color:#f2f2f2;font-size:13px;">${escapeHtml(
          a.details,
        )}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #262626;color:#a1a1a1;font-size:12px;white-space:nowrap;">${escapeHtml(
          a.batchNumber,
        )}</td>
      </tr>`;
    })
    .join("\n");

  const v = snapshot?.vaccine ?? null;
  const reading = snapshot?.latestReading ?? null;

  const stats = [
    reading
      ? {
          label: "Current temp",
          value: `${reading.temperature.toFixed(1)}°C`,
          note: v ? `band ${v.minStorageTemp}–${v.maxStorageTemp}°C` : "no band",
        }
      : null,
    snapshot
      ? {
          label: "Degradation",
          value: `${(snapshot.degradationIndex * 100).toFixed(1)}%`,
          note: `${snapshot.cumulativeHeatHours.toFixed(2)}h heat exposure`,
        }
      : null,
    snapshot
      ? { label: "Storage uptime", value: `${snapshot.uptimePercent}%`, note: "within safe range" }
      : null,
    {
      label: "Batch",
      value: v?.batchNumber ?? "—",
      note: v ? v.vaccineName : "no batch loaded",
    },
  ].filter(Boolean) as { label: string; value: string; note: string }[];

  const statCards = stats
    .map(
      (s) => `        <td style="padding:0 4px;vertical-align:top;width:25%;">
          <div style="border:1px solid #262626;border-radius:10px;padding:12px;">
            <div style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.45);">${escapeHtml(
              s.label,
            )}</div>
            <div style="margin-top:6px;font-size:20px;font-weight:600;color:#f2f2f2;">${escapeHtml(
              s.value,
            )}</div>
            <div style="margin-top:2px;font-size:11px;color:rgba(255,255,255,0.45);">${escapeHtml(
              s.note,
            )}</div>
          </div>
        </td>`,
    )
    .join("\n");

  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#0a0a0a;color:#f2f2f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
    <div style="max-width:640px;margin:0 auto;">
      <p style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.45);margin:0 0 8px;">ColdChain Monitor</p>
      <h1 style="font-size:20px;letter-spacing:0.02em;margin:0 0 20px;">${escapeHtml(
        alertSubject(alerts, snapshot),
      )}</h1>

      <table role="presentation" width="100%" style="border-collapse:separate;"><tr>${statCards}</tr></table>

      ${
        alerts.length
          ? `<table role="presentation" width="100%" style="border-collapse:collapse;margin-top:24px;border:1px solid #262626;border-radius:10px;">
      <tr>
        <th align="left" style="padding:10px 12px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.45);font-weight:500;border-bottom:1px solid #262626;">Time</th>
        <th align="left" style="padding:10px 12px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.45);font-weight:500;border-bottom:1px solid #262626;">Type</th>
        <th align="left" style="padding:10px 12px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.45);font-weight:500;border-bottom:1px solid #262626;">Details</th>
        <th align="left" style="padding:10px 12px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.45);font-weight:500;border-bottom:1px solid #262626;">Batch</th>
      </tr>
${rows}
    </table>`
          : `<p style="margin:24px 0 0;padding:16px;border:1px dashed #333;border-radius:10px;color:rgba(255,255,255,0.55);font-size:13px;">No open alerts to report. This message was sent manually to verify delivery.</p>`
      }

      <p style="font-size:12px;color:rgba(255,255,255,0.45);margin:28px 0 0;">
        <a href="${dashboardUrl}/alerts" style="color:#f2f2f2;">Open the alert log</a>
      </p>
    </div>
  </body>
</html>`;
}
