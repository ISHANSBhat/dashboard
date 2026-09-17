"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Copy, Check } from "lucide-react";
import { vaccineDataset } from "@/lib/vaccines";
import type { VaccineThreshold } from "@/types";

export function SettingsPanel({ activeVaccineId }: { activeVaccineId: string }) {
  const [selectedId, setSelectedId] = React.useState(activeVaccineId);
  const [copied, setCopied] = React.useState(false);
  const selected = vaccineDataset.vaccines.find((v) => v.id === selectedId) ?? vaccineDataset.vaccines[0];

  const snippet = `// arduino.ino
#include "vaccine_data.h"

// Active vaccine from the WHO/CDC dataset (no more hardcoding)
#define ACTIVE_VACCINE_ID "${selected.id}"`;

  async function copySnippet() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      toast.success("Arduino config snippet copied");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Vaccine</CardTitle>
          <CardDescription>
            Pick the vaccine stored in the mobile cooler. The thresholds below are what the
            Arduino and this dashboard both use.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vaccine-select">Vaccine</Label>
            <Select
              value={selectedId}
              onValueChange={(value) => {
                if (value) setSelectedId(value);
              }}
            >
              <SelectTrigger id="vaccine-select" className="w-full">
                <SelectValue placeholder="Select a vaccine" />
              </SelectTrigger>
              <SelectContent>
                {vaccineDataset.vaccines.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ThresholdTable vaccine={selected} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Arduino Configuration</CardTitle>
          <CardDescription>
            Copy this into arduino.ino to activate the selected vaccine for the ESP32.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <pre className="overflow-x-auto rounded-lg border border-border bg-black p-4 text-xs leading-6 text-zinc-300">
              {snippet}
            </pre>
            <Button
              size="sm"
              variant="ghost"
              className="absolute right-2 top-2"
              onClick={copySnippet}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>

          <Separator />

          <div className="space-y-2 text-sm">
            <div className="font-medium">Alarm defaults (WHO PQS E006)</div>
            <div className="grid grid-cols-1 gap-2 text-muted-foreground sm:grid-cols-3">
              <AlarmDefault
                label="Heat (stationary)"
                value={`≥${vaccineDataset.alarmDefaults.stationaryHeat.temp}°C for ${vaccineDataset.alarmDefaults.stationaryHeat.duration}h`}
              />
              <AlarmDefault
                label="Heat (mobile)"
                value={`≥${vaccineDataset.alarmDefaults.mobileHeat.temp}°C for ${vaccineDataset.alarmDefaults.mobileHeat.duration}h`}
              />
              <AlarmDefault
                label="Freeze"
                value={`≤${vaccineDataset.alarmDefaults.freeze.temp}°C for ${vaccineDataset.alarmDefaults.freeze.duration}h`}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Dataset source: {vaccineDataset.source}. Thresholds follow WHO EPI storage
            ranges and WHO PQS cumulative-exposure alarm limits.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ThresholdTable({ vaccine }: { vaccine: VaccineThreshold }) {
  return (
    <div className="rounded-lg border border-border">
      <table className="w-full text-sm">
        <tbody>
          <Row label="Vaccine" value={vaccine.name} />
          <Row label="Generic" value={vaccine.generic} />
          <Row label="Manufacturer" value={vaccine.manufacturer} />
          <Row label="WHO class" value={<Badge variant="outline" className="font-mono">{vaccine.whoClass}</Badge>} />
          <Row
            label="Storage range"
            value={`${vaccine.minTemp}°C to ${vaccine.maxTemp}°C (${vaccine.storageType})`}
          />
          <Row label="Freeze sensitive" value={vaccine.freezeSensitive ? "Yes" : "No"} />
          <Row
            label="Heat exposure limit"
            value={`${vaccine.heatExposureTemp}°C for ${vaccine.heatExposureHours}h`}
          />
          <Row label="CTC eligible" value={vaccine.ctcEligible ? "Yes" : "No"} />
          {vaccine.ctcEligible ? (
            <Row label="CTC limit" value={`${vaccine.ctcTemp}°C for ${vaccine.ctcHours}h`} />
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-3 py-2 text-muted-foreground">{label}</td>
      <td className="px-3 py-2 text-right font-medium">{value}</td>
    </tr>
  );
}

function AlarmDefault({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted p-3">
      <div className="text-xs font-medium text-foreground">{label}</div>
      <div className="mt-0.5 text-xs">{value}</div>
    </div>
  );
}