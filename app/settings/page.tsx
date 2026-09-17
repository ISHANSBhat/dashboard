import { PageHeader } from "@/components/page-header";
import { SettingsPanel } from "@/components/settings-panel";
import { getDashboardSnapshot } from "@/lib/influxdb";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const snapshot = await getDashboardSnapshot().catch(() => null);
  const activeVaccineId = snapshot?.vaccine?.vaccineId ?? "covishield";

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <PageHeader
        title="Settings"
        description="Configure the active vaccine and its cold-chain thresholds"
      />
      <SettingsPanel activeVaccineId={activeVaccineId} />
    </main>
  );
}