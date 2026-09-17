"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import type { AlertRecord } from "@/types";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "open" | "resolved";
type TypeFilter = "all" | "heat" | "cold" | "degradation";

export function AlertLog({ alerts }: { alerts: AlertRecord[] }) {
  const [status, setStatus] = React.useState<StatusFilter>("all");
  const [type, setType] = React.useState<TypeFilter>("all");

  const filtered = alerts.filter((a) => {
    const s = status === "all" ? true : status === "open" ? a.resolutionStatus === "Unresolved" : a.resolutionStatus !== "Unresolved";
    const t =
      type === "all"
        ? true
        : type === "heat"
          ? /heat|temperature_violation/i.test(a.alertType)
          : type === "cold"
            ? /cold|freeze/i.test(a.alertType)
            : /degradation/i.test(a.alertType);
    return s && t;
  });

  const openCount = alerts.filter((a) => a.resolutionStatus === "Unresolved").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1">
        {(
          [
            ["all", `All (${alerts.length})`],
            ["open", `Open (${openCount})`],
            ["resolved", "Resolved"],
          ] as [StatusFilter, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setStatus(value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              status === value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {label}
          </button>
        ))}
        <span className="mx-2 h-5 w-px bg-border" />
        {(
          [
            ["all", "All types"],
            ["heat", "Heat"],
            ["cold", "Cold / freeze"],
            ["degradation", "Degradation"],
          ] as [TypeFilter, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setType(value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              type === value
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Alert ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  No alerts match your filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((a) => (
                <TableRow key={`${a.alertId}-${a.time}`}>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatDateTime(a.time)}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {a.alertId}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        /degradation/i.test(a.alertType)
                          ? "destructive"
                          : /freeze|cold/i.test(a.alertType)
                            ? "outline"
                            : "secondary"
                      }
                    >
                      {a.alertType}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[320px] truncate text-sm">{a.details}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{a.batchNumber}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={a.resolutionStatus === "Unresolved" ? "destructive" : "secondary"}>
                      {a.resolutionStatus}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}