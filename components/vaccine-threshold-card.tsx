import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatTemp } from "@/lib/format";
import { vaccineDataset } from "@/lib/vaccines";
import type { VaccineBatch } from "@/types";

export function VaccineThresholdCard({ batch }: { batch: VaccineBatch | null }) {
  if (!batch) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Thresholds</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No batch loaded — thresholds unavailable.</p>
        </CardContent>
      </Card>
    );
  }

  const dataset = vaccineDataset.vaccines.find((v) => v.id === batch.vaccineId);
  const min = batch.minStorageTemp;
  const max = batch.maxStorageTemp;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Active Thresholds</CardTitle>
          <Badge variant="outline" className="font-mono">{batch.vaccineId || "unknown"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <ThresholdRow label="Storage range" value={`${formatTemp(min)} – ${formatTemp(max)}`} accent="emerald" />
        <ThresholdRow
          label="Heat threshold"
          value={dataset ? `${dataset.heatExposureTemp}°C for ${dataset.heatExposureHours}h` : `${batch.heatThresholdTemp}°C for ${batch.heatThresholdHours}h`}
          accent="amber"
        />
        <ThresholdRow
          label="Freeze sensitive"
          value={batch.freezeSensitive ? "Yes" : "No"}
          accent={batch.freezeSensitive ? "sky" : undefined}
        />
        {dataset?.freezeExposureTemp != null ? (
          <ThresholdRow
            label="Freeze exposure"
            value={`${dataset.freezeExposureTemp}°C / ${dataset.freezeExposureMinutes} min`}
            accent="sky"
          />
        ) : null}
        {dataset ? (
          <>
            <ThresholdRow label="WHO class" value={dataset.whoClass} accent="slate" />
            <ThresholdRow label="Storage type" value={dataset.storageType} accent="slate" />
          </>
        ) : null}
        {dataset?.ctcEligible ? (
          <ThresholdRow label="CTC eligible" value={`Yes — ${dataset.ctcTemp}°C / ${dataset.ctcHours}h`} accent="violet" />
        ) : null}
      </CardContent>
    </Card>
  );
}

function ThresholdRow({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium tabular-nums ${accent === "amber" ? "text-amber-400" : accent === "emerald" ? "text-emerald-400" : accent === "sky" ? "text-sky-400" : accent === "violet" ? "text-violet-400" : ""}`}>
        {value}
      </span>
    </div>
  );
}
