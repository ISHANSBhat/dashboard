import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { VaccineStatusCard } from "@/components/vaccine-status-card";
import { VaccineCatalog } from "@/components/vaccine-catalog";
import { vaccineDataset } from "@/lib/vaccines";
import { getDashboardSnapshot } from "@/lib/influxdb";
import { KpiCard } from "@/components/kpi-card";
import { Package, Boxes, Snowflake, Flame } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function VaccinesPage() {
  const snapshot = await getDashboardSnapshot().catch(() => null);
  const vaccines = vaccineDataset.vaccines;
  const freezeSensitiveCount = vaccines.filter((v) => v.freezeSensitive).length;
  const frozenCount = vaccines.filter((v) => v.storageType === "frozen" || v.storageType === "ultracold").length;
  const ctcCount = vaccines.filter((v) => v.ctcEligible).length;

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <PageHeader
        title="Vaccine Inventory"
        description={`WHO/CDC dataset with ${vaccines.length} vaccine entries and per-vaccine cold-chain thresholds`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Vaccines in dataset"
          value={vaccines.length}
          icon={<Package className="h-4 w-4" />}
        />
        <KpiCard
          title="Freeze-sensitive"
          value={freezeSensitiveCount}
          icon={<Snowflake className="h-4 w-4" />}
          hint="Require freeze monitoring"
        />
        <KpiCard
          title="Frozen storage"
          value={frozenCount}
          icon={<Flame className="h-4 w-4" />}
          hint="Frozen or ultra-cold"
        />
        <KpiCard
          title="CTC eligible"
          value={ctcCount}
          icon={<Boxes className="h-4 w-4" />}
          hint="Controlled temp chain"
        />
      </div>

      <VaccineStatusCard batch={snapshot?.vaccine ?? null} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Threshold Dataset</CardTitle>
          <CardDescription>
            Source: {vaccineDataset.source} · schema {vaccineDataset.schemaVersion} ·{" "}
            updated {vaccineDataset.updated}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VaccineCatalog vaccines={vaccines} />
        </CardContent>
      </Card>

      {vaccineDataset.references && vaccineDataset.references.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">References</CardTitle>
            <CardDescription>Regulatory guidance behind the threshold dataset</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {vaccineDataset.references.map((ref, i) => (
                <li key={i} className="text-sm">
                  <div className="font-medium text-foreground">
                    {ref.type === "manufacturer" ? "Package insert" : "Regulatory source"} · {ref.year}
                  </div>
                  <div className="mt-0.5 text-muted-foreground">
                    {ref.title}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{ref.publisher}</span>
                    {ref.url ? (
                      <a
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        View source ↗
                      </a>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </main>
  );
}