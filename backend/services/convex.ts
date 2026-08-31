export class ConvexUnavailable extends Error {
  constructor(message = "Convex is unavailable") {
    super(message);
    this.name = "ConvexUnavailable";
  }
}

type ConvexFunctionType = "query" | "mutation";

interface ConvexResponse<T> {
  value?: T;
}

export async function callConvex<T>(
  functionType: ConvexFunctionType,
  path: string,
  args: Record<string, unknown>,
): Promise<T> {
  const siteUrl = process.env.CONVEX_SITE_URL ?? process.env.CONVEX_URL;
  const token = process.env.CONVEX_APP_TOKEN;
  if (!siteUrl || !token) throw new ConvexUnavailable("Convex is not configured");

  try {
    const response = await fetch(`${siteUrl.replace(/\/$/, "")}/api/${functionType}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path, args: { token, ...args } }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) throw new ConvexUnavailable(`Convex returned HTTP ${response.status}`);
    const body = (await response.json()) as ConvexResponse<T>;
    if (body.value === undefined) throw new ConvexUnavailable("Convex returned an invalid response");
    return body.value;
  } catch (error) {
    if (error instanceof ConvexUnavailable) throw error;
    throw new ConvexUnavailable("Convex is temporarily unavailable");
  }
}