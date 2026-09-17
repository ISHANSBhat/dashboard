"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { VaccineThreshold } from "@/types";
import { formatTemp } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

type StorageFilter = "all" | "refrigerated" | "frozen" | "ultracold";

export function VaccineCatalog({ vaccines }: { vaccines: VaccineThreshold[] }) {
  const [query, setQuery] = React.useState("");
  const [storage, setStorage] = React.useState<StorageFilter>("all");
  const [onlyCTC, setOnlyCTC] = React.useState(false);

  const filtered = vaccines.filter((v) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      v.name.toLowerCase().includes(q) ||
      v.generic.toLowerCase().includes(q) ||
      v.manufacturer.toLowerCase().includes(q) ||
      v.id.toLowerCase().includes(q);
    const matchesStorage = storage === "all" || v.storageType === storage;
    const matchesCTC = !onlyCTC || v.ctcEligible;
    return matchesQuery && matchesStorage && matchesCTC;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search vaccine, generic, manufacturer…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {(
            [
              ["all", "All"],
              ["refrigerated", "2–8°C"],
              ["frozen", "Frozen"],
              ["ultracold", "Ultra-cold"],
            ] as [StorageFilter, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setStorage(value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                storage === value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {label}
            </button>
          ))}
          <Separator orientation="vertical" className="mx-1 h-5" />
          <button
            onClick={() => setOnlyCTC((c) => !c)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              onlyCTC
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            CTC eligible
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vaccine</TableHead>
              <TableHead>WHO class</TableHead>
              <TableHead>Storage</TableHead>
              <TableHead>Temperature range</TableHead>
              <TableHead>Heat exposure limit</TableHead>
              <TableHead>Freeze sensitive</TableHead>
              <TableHead className="text-right">CTC</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  No vaccines match your filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>
                    <div className="font-medium leading-tight">{v.name}</div>
                    <div className="text-xs text-muted-foreground">{v.generic}</div>
                    <div className="text-xs text-muted-foreground">{v.manufacturer}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {v.whoClass}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{storageLabel(v.storageType)}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {formatTemp(v.minTemp)} – {formatTemp(v.maxTemp)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {v.heatExposureTemp > v.maxTemp
                      ? `>${formatTemp(v.heatExposureTemp)} for ${v.heatExposureHours}h`
                      : `Threshold ${formatTemp(v.heatExposureTemp)} for ${v.heatExposureHours}h`}
                  </TableCell>
                  <TableCell>
                    <Badge variant={v.freezeSensitive ? "destructive" : "secondary"}>
                      {v.freezeSensitive ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{v.ctcEligible ? "✓" : "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function storageLabel(t: VaccineThreshold["storageType"]): string {
  switch (t) {
    case "refrigerated":
      return "Refrigerated";
    case "frozen":
      return "Frozen";
    case "ultracold":
      return "Ultra-cold";
  }
}