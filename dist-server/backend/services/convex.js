export class ConvexUnavailable extends Error {
    constructor(message = "Convex is unavailable") {
        super(message);
        this.name = "ConvexUnavailable";
    }
}
export async function callConvex(functionType, path, args) {
    const siteUrl = process.env.CONVEX_SITE_URL ?? process.env.CONVEX_URL;
    const token = process.env.CONVEX_APP_TOKEN;
    if (!siteUrl || !token)
        throw new ConvexUnavailable("Convex is not configured");
    try {
        const response = await fetch(`${siteUrl.replace(/\/$/, "")}/api/${functionType}`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ path, args: { token, ...args } }),
            signal: AbortSignal.timeout(12_000),
        });
        if (!response.ok)
            throw new ConvexUnavailable(`Convex returned HTTP ${response.status}`);
        const body = (await response.json());
        if (body.value === undefined)
            throw new ConvexUnavailable("Convex returned an invalid response");
        return body.value;
    }
    catch (error) {
        if (error instanceof ConvexUnavailable)
            throw error;
        throw new ConvexUnavailable("Convex is temporarily unavailable");
    }
}
