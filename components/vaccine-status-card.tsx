import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { vaccineDataset } from "@/lib/vaccines";
import { formatTemp, daysUntil } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { VaccineBatch } from "@/types";

export function VaccineStatusCard({ batch }: { batch: VaccineBatch | null }) {
  if (!batch) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Vaccine Batch</CardTitle>
          <CardDescription>No batch found in InfluxDB yet.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const threshold = vaccineDataset.vaccines.find((v) => v.id === batch.vaccineId);
  const days = daysUntil(batch.expiryDate);
  const degraded = batch.degradationIndex >= 1;

  return (
    <Card className={cn(degraded && "border-destructive/50")}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base">{batch.vaccineName}</CardTitle>
          <CardDescription>
            Batch {batch.batchNumber} · {batch.unitId}
          </CardDescription>
        </div>
        <Badge variant={degraded ? "destructive" : days < 30 ? "outline" : "secondary"}>
          {degraded ? "Degraded" : days >= 0 ? `${days} days left` : "Expired"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Spec label="Storage range" value={`${formatTemp(batch.minStorageTemp)} – ${formatTemp(batch.maxStorageTemp)}`} />
          <Spec label="Quantity" value={String(batch.quantity)} />
          <Spec label="Made" value={batch.manufactureDate} />
          <Spec label="Expires" value={batch.expiryDate} />
          {threshold ? (
            <>
              <Spec label="WHO class" value={threshold.whoClass} />
              <Spec
                label="Heat limit"
                value={`${threshold.heatExposureTemp}°C for ${threshold.heatExposureHours}h`}
              />
            </>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Degradation index</span>
            <span className="font-medium tabular-nums">
              {(batch.degradationIndex * 100).toFixed(1)}%
            </span>
          </div>
          <Progress
            value={Math.min(100, batch.degradationIndex * 100)}
            className={cn(
              degraded && "bg-destructive",
              !degraded && batch.degradationIndex > 0.5 && "bg-amber-500",
            )}
          />
        </div>
        <Link href="/vaccines" className="text-sm font-medium text-primary hover:underline">
          View inventory →
        </Link>
      </CardContent>
    </Card>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}