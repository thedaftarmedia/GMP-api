import type { NormalizedIPO } from "./types.js";

interface ConvexMutationResult {
  id: string;
  action: "created" | "updated";
  historyCreated: boolean;
}

function getConfig() {
  const convexUrl =
    process.env.CONVEX_URL;

  const token =
    process.env.CONVEX_APP_TOKEN;

  if (!convexUrl || !token) {
    throw new Error(
      "Convex is not configured. Set CONVEX_URL and CONVEX_APP_TOKEN before scraping."
    );
  }

  return {
    convexUrl: convexUrl.replace(/\/$/, ""),
    token,
  };
}

function compactRecord(record: NormalizedIPO): Record<string, unknown> {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== null));
}

async function convexCall<T>(
  path: string,
  args: Record<string, unknown>
): Promise<T> {
  const { convexUrl, token } = getConfig();

  const response = await fetch(
    `${convexUrl}/api/mutation`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        path,
        args: {
          token,
          ...args,
        },
        format: "json",
      }),
      signal: AbortSignal.timeout(20_000),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();

    throw new Error(
      `Convex mutation failed with HTTP ${response.status}: ${errorBody}`
    );
  }

  const body = (await response.json()) as {
    status?: string;
    value?: T;
    errorMessage?: string;
  };

  if (body.status === "error") {
    throw new Error(
      body.errorMessage ??
        "Convex mutation returned an error"
    );
  }

  if (!body.value) {
    throw new Error(
      "Convex mutation returned an invalid response"
    );
  }

  return body.value;
}

export function upsertIpo(record: NormalizedIPO): Promise<ConvexMutationResult> {
  return convexCall<ConvexMutationResult>("ipos:upsertIpo", compactRecord(record));
}