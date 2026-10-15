"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Mail, Send, Loader2, TriangleAlert } from "lucide-react";

interface EmailStatus {
  configured: boolean;
  enabled: boolean;
  dryRun: boolean;
  missing: string[];
  from: string;
  to: string;
  pending: number;
  openAlerts: number;
  window: string;
}

export function AlertEmailPanel() {
  const [status, setStatus] = React.useState<EmailStatus | null>(null);
  const [sending, setSending] = React.useState(false);

  React.useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const res = await fetch("/api/alerts/email", { signal: controller.signal });
        if (!res.ok) return;
        setStatus((await res.json()) as EmailStatus);
      } catch {
        // ignore transient failures; the panel just stays in its loading state
      }
    }

    load();
    // Refresh the pending count alongside the dashboard's 10s snapshot poll.
    const interval = window.setInterval(load, 10000);
    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, []);

  async function send(force: boolean) {
    setSending(true);
    try {
      const res = await fetch("/api/alerts/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force }),
      });

      const payload = (await res.json().catch(() => ({}))) as {
        sent?: number;
        message?: string;
        error?: string;
        missing?: string[];
        dryRun?: boolean;
      };

      if (!res.ok) {
        toast.error(payload.error ?? "Could not send alert email");
        return;
      }

      if (force) {
        toast.success(payload.dryRun ? "Dry run — nothing sent" : "Test email sent");
      } else if (payload.sent) {
        toast.success(`${payload.sent} alert${payload.sent === 1 ? "" : "s"} emailed`);
      } else {
        toast.info(payload.message ?? "Nothing to send");
      }

      const refreshed = await fetch("/api/alerts/email").catch(() => null);
      if (refreshed?.ok) setStatus((await refreshed.json()) as EmailStatus);
    } catch {
      toast.error("Could not reach the alert email endpoint");
    } finally {
      setSending(false);
    }
  }

  if (!status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4" />
            Email Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-6 text-center text-sm text-muted-foreground">Checking configuration…</p>
        </CardContent>
      </Card>
    );
  }

  if (!status.configured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4" />
            Email Alerts
            <Badge variant="outline" className="font-mono">
              not configured
            </Badge>
          </CardTitle>
          <CardDescription>
            Add the missing environment variables and restart the dev server
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {status.missing.length > 0 ? (
            <ul className="space-y-1 font-mono text-xs text-muted-foreground">
              {status.missing.map((k) => (
                <li key={k}>{k}</li>
              ))}
            </ul>
          ) : null}
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <TriangleAlert className="h-3.5 w-3.5" />
            Set ALERT_EMAIL_ENABLED=1 to turn delivery back on.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="h-4 w-4" />
          Email Alerts
          {status.dryRun ? (
            <Badge variant="outline">dry run</Badge>
          ) : (
            <Badge>active</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Unresolved alerts are emailed once, then tracked so a flapping sensor cannot
          flood the mailbox
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 text-sm sm:grid-cols-3">
          <Stat label="Pending" value={`${status.pending}`} tone={status.pending > 0 ? "warn" : "good"} />
          <Stat label="Open alerts" value={`${status.openAlerts}`} tone={status.openAlerts > 0 ? "warn" : "good"} />
          <Stat label="Window" value={status.window} />
        </div>

        <Separator />

        <div className="space-y-2 text-xs text-muted-foreground">
          <div>
            <span className="font-medium text-foreground">From</span> · {status.from}
          </div>
          <div>
            <span className="font-medium text-foreground">To</span> · {status.to}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled={sending || status.pending === 0} onClick={() => send(false)}>
            {sending ? <Loader2 className="animate-spin" /> : <Send />}
            Send {status.pending} pending
          </Button>
          <Button size="sm" variant="outline" disabled={sending} onClick={() => send(true)}>
            Send test
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "good" | "warn" }) {
  const color =
    tone === "good" ? "text-emerald-400" : tone === "warn" ? "text-amber-400" : "text-foreground";
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-0.5 font-semibold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}
