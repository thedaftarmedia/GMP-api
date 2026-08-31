import type { NormalizedIPO } from "./types.js";

interface ConvexMutationResult {
  id: string;
  action: "created" | "updated";
  historyCreated: boolean;
}

function getConfig() {
  const siteUrl = process.env.CONVEX_SITE_URL ?? process.env.CONVEX_URL;
  const token = process.env.CONVEX_APP_TOKEN;
  if (!siteUrl || !token) {
    throw new Error("Convex is not configured. Set CONVEX_SITE_URL and CONVEX_APP_TOKEN before scraping.");
  }
  return { siteUrl: siteUrl.replace(/\/$/, ""), token };
}

function compactRecord(record: NormalizedIPO): Record<string, unknown> {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== null));
}

async function convexCall<T>(path: string, args: Record<string, unknown>): Promise<T> {
  const { siteUrl, token } = getConfig();
  const response = await fetch(`${siteUrl}/api/mutation`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ path, args: { token, ...args } }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`Convex mutation failed with HTTP ${response.status}`);
  const body = (await response.json()) as { value?: T };
  if (!body.value) throw new Error("Convex mutation returned an invalid response");
  return body.value;
}

export function upsertIpo(record: NormalizedIPO): Promise<ConvexMutationResult> {
  return convexCall<ConvexMutationResult>("ipos:upsertIpo", compactRecord(record));
}