"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TemperatureChart } from "@/components/charts/temperature-chart";
import { formatTemp } from "@/lib/format";
import type { VaccineTemperatureSeries } from "@/types";

const ACCENTS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function VaccineChartCard({ series, index }: { series: VaccineTemperatureSeries; index: number }) {
  const t = series.threshold;
  const min = t?.minTemp ?? 2;
  const max = t?.maxTemp ?? 8;
  const heat = t?.heatExposureTemp ?? null;
  const freeze = t?.freezeExposureTemp ?? null;
  const accent = ACCENTS[index % ACCENTS.length];

  const latest = series.data[series.data.length - 1];
  const latestTemp = latest?.temperature ?? 0;
  const inRange = latestTemp >= min && latestTemp <= max;
  const statusLabel = series.data.length === 0
    ? "No data"
    : inRange
      ? "In range"
      : latestTemp > max
        ? "Above max"
        : "Below min";

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="truncate text-base">{series.vaccineName}</CardTitle>
            <CardDescription>
              {t ? `${t.whoClass} class · ${t.storageType}` : "No WHO metadata"} · {series.data.length} points
            </CardDescription>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge
              variant={
                series.data.length === 0
                  ? "secondary"
                  : inRange
                    ? "default"
                    : "destructive"
              }
              className="text-xs"
            >
              {statusLabel}
            </Badge>
          </div>
        </div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <span>{formatTemp(min)} – {formatTemp(max)}</span>
          {heat != null ? <span>Heat ≥ {heat}°C</span> : null}
          {freeze != null ? <span>Freeze ≤ {freeze}°C</span> : null}
          {t?.freezeSensitive ? <span>Freeze-sensitive</span> : null}
        </div>
      </CardHeader>
      <CardContent>
        {series.data.length > 0 ? (
          <TemperatureChart
            data={series.data}
            minTemp={min}
            maxTemp={max}
            freezeSensitive={t?.freezeSensitive ?? true}
            heatThresholdTemp={heat}
            freezeThresholdTemp={freeze}
            accent={accent}
          />
        ) : (
          <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
            No temperature data for this vaccine yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
