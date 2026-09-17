import { Suspense } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { LiveSnapshot } from "@/components/live-snapshot";
import { VaccineStatusCard } from "@/components/vaccine-status-card";
import { VaccineThresholdCard } from "@/components/vaccine-threshold-card";
import { VaccineChartCard } from "@/components/vaccine-chart-card";
import { RecentAlerts } from "@/components/recent-alerts";
import { getDashboardSnapshot, queryTemperatureHistoryByVaccine, queryAlerts } from "@/lib/influxdb";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const [snapshot, vaccineSeries, alerts] = await Promise.all([
    getDashboardSnapshot().catch(() => null),
    queryTemperatureHistoryByVaccine("-24h").catch(() => []),
    queryAlerts("-24h").catch(() => []),
  ]);

  const latest = snapshot?.latestReading ?? null;
  const vaccine = snapshot?.vaccine ?? null;

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <PageHeader
        title="Overview"
        description={
          latest ? (
            <span>
              Live monitoring · last reading {timeAgo(latest.time)} ·{" "}
              {latest.temperature.toFixed(1)}°C at {latest.latitude.toFixed(4)},{" "}
              {latest.longitude.toFixed(4)}
            </span>
          ) : (
            "Live monitoring · waiting for sensor data"
          )
        }
      />

      {snapshot ? (
        <LiveSnapshot initial={snapshot} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          {vaccineSeries.length > 0 ? (
            vaccineSeries.map((s, i) => (
              <VaccineChartCard key={s.vaccineId || "legacy"} series={s} index={i} />
            ))
          ) : (
            <Card>
              <CardContent className="py-16 text-center text-sm text-muted-foreground">
                No temperature data available for any vaccine in the last 24h.
              </CardContent>
            </Card>
          )}
        </div>
        <div className="flex flex-col gap-4">
          <VaccineStatusCard batch={vaccine} />
          <VaccineThresholdCard batch={vaccine} />
        </div>
      </div>

      <Separator />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Recent Alerts</CardTitle>
            <CardDescription>Cold-chain violations in the last 24 hours</CardDescription>
          </div>
          <Link href="/alerts" className="text-sm font-medium text-primary hover:underline">
            View all →
          </Link>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-40 w-full rounded-lg" />}>
            <RecentAlerts alerts={alerts} />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}