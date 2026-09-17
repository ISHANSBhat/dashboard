import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ReadingTone = "normal" | "high" | "low" | "critical";

export function ReadingBadge({
  tone,
  className,
}: {
  tone: ReadingTone;
  className?: string;
}) {
  return (
    <Badge
      variant={tone === "critical" ? "destructive" : tone === "high" ? "outline" : "secondary"}
      className={cn(
        tone === "high" && "border-amber-500/40 bg-amber-500/10 text-amber-400",
        tone === "low" && "border-sky-500/40 bg-sky-500/10 text-sky-400",
        tone === "normal" && "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
        className,
      )}
    >
      {tone === "normal" && "In range"}
      {tone === "high" && "High temp"}
      {tone === "low" && "Cold / freeze risk"}
      {tone === "critical" && "Degraded"}
    </Badge>
  );
}