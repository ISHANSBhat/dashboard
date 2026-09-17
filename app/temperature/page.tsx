import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { ReadingBadge } from "@/components/reading-badge";
import { DegradationChart } from "@/components/charts/degradation-chart";
import { VaccineChartCard } from "@/components/vaccine-chart-card";
import { VaccineThresholdCard } from "@/components/vaccine-threshold-card";
import { queryTemperatureHistoryByVaccine, queryDegradationHistory, getDashboardSnapshot } from "@/lib/influxdb";
import { vaccineDataset } from "@/lib/vaccines";
import { KpiCard } from "@/components/kpi-card";
import { Thermometer, Snowflake, Flame, TrendingUp } from "lucide-react";
import { formatDateTime, formatTemp } from "@/lib/format";

export const dynamic = "force-dynamic";

const RANGES = [
  { label: "24 hours", value: "-24h" },
  { label: "7 days", value: "-7d" },
  { label: "30 days", value: "-30d" },
];

export default async function TemperaturePage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const fluxRange = RANGES.find((r) => r.value === range)?.value ?? "-24h";

  const [vaccineSeries, degradation, snapshot] = await Promise.all([
    queryTemperatureHistoryByVaccine(fluxRange).catch(() => []),
    queryDegradationHistory(fluxRange).catch(() => []),
    getDashboardSnapshot().catch(() => null),
  ]);

  const vaccine = snapshot?.vaccine ?? null;
  const threshold = vaccine
    ? vaccineDataset.vaccines.find((v) => v.id === vaccine.vaccineId)
    : undefined;
  const min = vaccine?.minStorageTemp ?? threshold?.minTemp ?? 2;
  const max = vaccine?.maxStorageTemp ?? threshold?.maxTemp ?? 8;
  const freezeSensitive = threshold?.freezeSensitive ?? vaccine?.freezeSensitive ?? true;

  const allTemps = vaccineSeries.flatMap((s) => s.data.map((p) => p.temperature)).filter((t) => !Number.isNaN(t));
  const avg = allTemps.length ? allTemps.reduce((a, b) => a + b, 0) / allTemps.length : 0;
  const minSeen = allTemps.length ? Math.min(...allTemps) : 0;
  const maxSeen = allTemps.length ? Math.max(...allTemps) : 0;
  const violationCount = allTemps.filter((t) => t > max || (freezeSensitive && t < min)).length;

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <PageHeader
        title="Temperature Monitor"
        description={`Sensor S-01 · ${RANGES.find((r) => r.value === fluxRange)?.label ?? "24 hours"} view`}
      >
        <div className="flex items-center gap-1 rounded-lg border border-border p-1">
          {RANGES.map((r) => (
            <a
              key={r.value}
              href={`/temperature?range=${encodeURIComponent(r.value)}`}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                r.value === fluxRange
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {r.label}
            </a>
          ))}
        </div>
      </PageHeader>

      {snapshot?.latestReading ? (
        <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
          <div>
            <div className="text-xs text-muted-foreground">Current</div>
            <div className="text-4xl font-semibold tabular-nums tracking-tight">
              {snapshot.latestReading.temperature.toFixed(1)}°C
            </div>
            <div className="text-xs text-muted-foreground">
              {formatDateTime(snapshot.latestReading.time)}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <ReadingBadge
              tone={
                snapshot.latestReading.temperature > max
                  ? "high"
                  : snapshot.latestReading.temperature < min
                    ? "low"
                    : "normal"
              }
            />
            <span className="text-xs text-muted-foreground">
              Band {formatTemp(min)} – {formatTemp(max)}
            </span>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Average"
          value={avg.toFixed(1)}
          unit="°C"
          icon={<Thermometer className="h-4 w-4" />}
          hint="Over selected period"
        />
        <KpiCard
          title="Minimum"
          value={minSeen.toFixed(1)}
          unit="°C"
          icon={<Snowflake className="h-4 w-4" />}
          tone={freezeSensitive && minSeen < min ? "bad" : "default"}
          hint={
            freezeSensitive && minSeen < min
              ? `Below storage min ${min}°C`
              : `Freeze threshold ${threshold?.freezeExposureTemp ?? -0.5}°C`
          }
        />
        <KpiCard
          title="Maximum"
          value={maxSeen.toFixed(1)}
          unit="°C"
          icon={<Flame className="h-4 w-4" />}
          tone={maxSeen > max ? "bad" : "default"}
          hint={maxSeen > max ? `Above storage max ${max}°C` : `Storage max ${max}°C`}
        />
        <KpiCard
          title="Violations"
          value={violationCount}
          unit="samples"
          icon={<TrendingUp className="h-4 w-4" />}
          tone={violationCount > 0 ? "bad" : "good"}
          hint="Readings outside safe band"
        />
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex flex-col gap-4 lg:w-2/3">
          {vaccineSeries.length > 0 ? (
            vaccineSeries.map((s, i) => (
              <VaccineChartCard key={s.vaccineId || "legacy"} series={s} index={i} />
            ))
          ) : (
            <Card>
              <CardContent className="py-16 text-center text-sm text-muted-foreground">
                No temperature data in this period yet.
              </CardContent>
            </Card>
          )}
        </div>
        <div className="lg:w-1/3">
          <VaccineThresholdCard batch={vaccine} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Degradation Index</CardTitle>
          <CardDescription>
            Predicted vaccine degradation from cumulative temperature exposure
          </CardDescription>
        </CardHeader>
        <CardContent>
          {degradation.length > 0 ? (
            <DegradationChart data={degradation} />
          ) : (
            <p className="py-16 text-center text-sm text-muted-foreground">
              No degradation records yet — the Arduino writes these every 5 minutes
              once heat exposure is tracked.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
