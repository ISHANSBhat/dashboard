import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function KpiCard({
  title,
  value,
  unit,
  icon,
  hint,
  tone = "default",
  className,
}: {
  title: string;
  value: React.ReactNode;
  unit?: string;
  icon?: React.ReactNode;
  hint?: React.ReactNode;
  tone?: "default" | "good" | "warn" | "bad";
  className?: string;
}) {
  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardDescription className="flex items-center gap-2 text-sm font-medium">
          {icon ? <span className="text-muted-foreground">{icon}</span> : null}
          {title}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-1">
          <span
            className={cn(
              "text-3xl font-semibold tracking-tight tabular-nums",
              tone === "good" && "text-emerald-400",
              tone === "warn" && "text-amber-400",
              tone === "bad" && "text-red-400",
            )}
          >
            {value}
          </span>
          {unit ? <span className="text-sm text-muted-foreground">{unit}</span> : null}
        </div>
        {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
      </CardContent>
    </Card>
  );
}