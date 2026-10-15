/**
 * Which alerts have already been emailed.
 *
 * Mirrors photoportfolio/data/notify-state.json: the state file is the only
 * thing standing between a flapping sensor and a mailbox full of duplicates, so
 * it is written *after* Resend accepts the send and never before. If the send
 * fails the alert stays pending and the next run retries it.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

const STATE_FILE = join(process.cwd(), "data", "email-state.json");

export async function readSentAlerts(): Promise<Set<string>> {
  try {
    const raw = await readFile(STATE_FILE, "utf8");
    const { sent } = JSON.parse(raw) as { sent?: string[] };
    return new Set(sent ?? []);
  } catch {
    // No state yet. Treated as "nothing sent" so the first run emails whatever
    // is currently open — which is the behaviour you want when testing.
    return new Set();
  }
}

export async function recordSentAlerts(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  const sent = await readSentAlerts();
  for (const k of keys) sent.add(k);
  await mkdir(dirname(STATE_FILE), { recursive: true });
  await writeFile(STATE_FILE, JSON.stringify({ sent: [...sent] }, null, 2) + "\n", "utf8");
}

/** Drops keys whose alerts are resolved so the file cannot grow forever. */
export async function pruneSentAlerts(resolvedKeys: string[]): Promise<void> {
  if (resolvedKeys.length === 0) return;
  const sent = await readSentAlerts();
  for (const k of resolvedKeys) sent.delete(k);
  await mkdir(dirname(STATE_FILE), { recursive: true });
  await writeFile(STATE_FILE, JSON.stringify({ sent: [...sent] }, null, 2) + "\n", "utf8");
}
