import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { AlertLog } from "@/components/alert-log";
import { AlertEmailPanel } from "@/components/alert-email-panel";
import { queryAlerts, queryAlertCounts } from "@/lib/influxdb";
import { KpiCard } from "@/components/kpi-card";
import { Bell, BellRing, AlertTriangle, Snowflake } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  const [alerts, counts] = await Promise.all([
    queryAlerts("-7d").catch(() => []),
    queryAlertCounts("-7d").catch(() => ({ open: 0, total: 0, heat24h: 0, cold24h: 0 })),
  ]);

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <PageHeader
        title="Alerts"
        description="Cold-chain violations and degradation warnings across all monitored units"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Open Alerts"
          value={counts.open}
          unit="active"
          tone={counts.open > 0 ? "bad" : "good"}
          icon={<BellRing className="h-4 w-4" />}
        />
        <KpiCard
          title="Total · 7 days"
          value={counts.total}
          icon={<Bell className="h-4 w-4" />}
        />
        <KpiCard
          title="Heat / Degradation"
          value={counts.heat24h}
          tone={counts.heat24h > 0 ? "warn" : "good"}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <KpiCard
          title="Cold / Freeze"
          value={counts.cold24h}
          tone={counts.cold24h > 0 ? "warn" : "good"}
          icon={<Snowflake className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <AlertEmailPanel />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Delivery</CardTitle>
            <CardDescription>How an alert reaches you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              The ESP32 writes every violation to the <code className="font-mono text-xs">ALERT</code>{" "}
              measurement in InfluxDB with a{" "}
              <code className="font-mono text-xs">RESOLUTION_STATUS</code> of{" "}
              <code className="font-mono text-xs">Unresolved</code>.
            </p>
            <p>
              This page reads that measurement on demand, filters out anything already emailed, and
              hands the rest to Resend. Nothing is sent twice, and a failed send stays queued for the
              next attempt.
            </p>
            <p>
              The same digest runs unattended from a cron hitting{" "}
              <code className="font-mono text-xs">POST /api/alerts/email</code> — useful when the
              dashboard is not open.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alert Log · last 7 days</CardTitle>
          <CardDescription>
            Triggered by the Arduino when readings leave the vaccine&apos;s storage band
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertLog alerts={alerts} />
        </CardContent>
      </Card>
    </main>
  );
}