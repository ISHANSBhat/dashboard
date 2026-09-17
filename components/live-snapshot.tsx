"use client";

import * as React from "react";
import type { DashboardSnapshot } from "@/types";
import { KpiCard } from "@/components/kpi-card";
import { Thermometer, Bell, Package, Activity } from "lucide-react";

export function LiveSnapshot({ initial }: { initial: DashboardSnapshot }) {
  const [snapshot, setSnapshot] = React.useState<DashboardSnapshot>(initial);

  React.useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/snapshot", { signal: controller.signal });
        if (res.ok) {
          const data = (await res.json()) as DashboardSnapshot;
          if (!cancelled) setSnapshot(data);
        }
      } catch {
        // ignore transient failures
      }
    }

    const interval = window.setInterval(poll, 10000);
    return () => {
      cancelled = true;
      controller.abort();
      window.clearInterval(interval);
    };
  }, []);

  const latest = snapshot.latestReading;
  const vaccine = snapshot.vaccine;
  const min = vaccine?.minStorageTemp ?? 2;
  const max = vaccine?.maxStorageTemp ?? 8;

  const tempTone =
    latest && (latest.temperature > max || latest.temperature < min)
      ? latest.temperature > max
        ? "bad"
        : "bad"
      : "good";
  const alertTone = snapshot.openAlerts > 0 ? "bad" : "good";
  const degTone = snapshot.degradationIndex > 0.5 ? "bad" : snapshot.degradationIndex > 0.2 ? "warn" : "good";

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        title="Current Temperature"
        value={latest ? latest.temperature.toFixed(1) : "—"}
        unit="°C"
        tone={tempTone}
        icon={<Thermometer className="h-4 w-4" />}
        hint={
          latest ? (
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              {vaccine ? `${min}–${max}°C range` : "No range found"}
            </span>
          ) : (
            "Waiting for sensor data"
          )
        }
      />
      <KpiCard
        title="Open Alerts"
        value={snapshot.openAlerts}
        unit="active"
        tone={alertTone}
        icon={<Bell className="h-4 w-4" />}
        hint={`${snapshot.totalAlerts24h} alerts in last 24h`}
      />
      <KpiCard
        title="Degradation Index"
        value={`${(snapshot.degradationIndex * 100).toFixed(1)}%`}
        unit=""
        tone={degTone}
        icon={<Activity className="h-4 w-4" />}
        hint={`${snapshot.cumulativeHeatHours.toFixed(2)}h cumulative heat exposure`}
      />
      <KpiCard
        title="Storage Uptime"
        value={`${snapshot.uptimePercent}%`}
        unit=""
        tone={snapshot.uptimePercent > 95 ? "good" : snapshot.uptimePercent > 80 ? "warn" : "bad"}
        icon={<Package className="h-4 w-4" />}
        hint="Within safe range (24h)"
      />
    </div>
  );
}