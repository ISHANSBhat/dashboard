/**
 * Minimal Resend client.
 *
 * Plain `fetch` against the REST API rather than the `resend` SDK: this project
 * only ever sends one kind of message, and a dependency-free client is easier to
 * audit in a DBMS coursework repo.
 *
 * Two non-obvious details carried over from photoportfolio/scripts/notify.mjs:
 *   1. Resend rejects requests with no `User-Agent` (error 1010), so every call
 *      goes through `resendFetch` instead of bare `fetch`.
 *   2. Unconfigured is a normal, non-fatal state — the dashboard must still
 *      render when email keys are missing.
 */

const RESEND_BASE = "https://api.resend.com";

export interface EmailMessage {
  to: string[];
  subject: string;
  html: string;
  text: string;
}

export interface SendResult {
  id: string;
}

/**
 * Env is read lazily on every call rather than at module load so that a
 * `next dev` restart picks up edits without reimporting the module.
 */
function config() {
  return {
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.ALERT_FROM ?? process.env.NOTIFY_FROM,
    to: process.env.ALERT_TO,
    enabled: process.env.ALERT_EMAIL_ENABLED !== "0",
    dryRun: process.env.ALERT_EMAIL_DRY_RUN === "1",
    dashboardUrl: (process.env.DASHBOARD_URL ?? "http://localhost:3000").replace(
      /\/$/,
      "",
    ),
  };
}

export function emailMissingKeys(): string[] {
  const c = config();
  const required: [string, string | undefined][] = [
    ["RESEND_API_KEY", c.apiKey],
    ["ALERT_FROM", c.from],
    ["ALERT_TO", c.to],
  ];
  return required.filter(([, v]) => !v).map(([k]) => k);
}

export function emailStatus() {
  const c = config();
  const missing = emailMissingKeys();
  return {
    configured: missing.length === 0 && c.enabled,
    enabled: c.enabled,
    dryRun: c.dryRun,
    missing,
    from: c.from ?? "",
    to: c.to ?? "",
    dashboardUrl: c.dashboardUrl,
  };
}

function resendFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const apiKey = config().apiKey;
  return fetch(`${RESEND_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      // Without this Resend answers 403 with error code 1010.
      "User-Agent": "coldchain-dashboard/1.0",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers || {}),
    },
  });
}

/**
 * Sends one transactional message. Returns `{ id }` on success; throws with the
 * provider's own error body attached so callers can log something actionable.
 */
export async function sendEmail(message: EmailMessage): Promise<SendResult> {
  const c = config();

  if (c.dryRun) {
    console.log(
      `[email] DRY RUN — would send "${message.subject}" to ${message.to.join(", ")}`,
    );
    return { id: "dry-run" };
  }

  const res = await resendFetch("/emails", {
    method: "POST",
    body: JSON.stringify({
      from: c.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    }),
  });

  const payload = (await res.json().catch(() => ({}))) as { id?: string };

  if (!res.ok || !payload.id) {
    throw new Error(`Resend send failed: HTTP ${res.status} ${JSON.stringify(payload)}`);
  }

  return { id: payload.id };
}
