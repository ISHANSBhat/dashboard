import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import type { AlertRecord } from "@/types";

export function RecentAlerts({ alerts }: { alerts: AlertRecord[] }) {
  if (alerts.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No alerts in the last 24 hours.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Time</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Details</TableHead>
          <TableHead className="text-right">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {alerts.slice(0, 5).map((a) => (
          <TableRow key={`${a.alertId}-${a.time}`}>
            <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
              {formatDateTime(a.time)}
            </TableCell>
            <TableCell>
              <Badge
                variant={a.resolutionStatus === "Unresolved" ? "destructive" : "secondary"}
              >
                {a.alertType}
              </Badge>
            </TableCell>
            <TableCell className="max-w-[240px] truncate text-sm">{a.details}</TableCell>
            <TableCell className="text-right text-sm text-muted-foreground">
              {a.resolutionStatus}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function AlertsLink() {
  return (
    <Link href="/alerts" className="text-sm font-medium text-primary hover:underline">
      View all alerts →
    </Link>
  );
}