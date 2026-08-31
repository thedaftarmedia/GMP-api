function getConfig() {
    const siteUrl = process.env.CONVEX_SITE_URL ?? process.env.CONVEX_URL;
    const token = process.env.CONVEX_APP_TOKEN;
    if (!siteUrl || !token) {
        throw new Error("Convex is not configured. Set CONVEX_SITE_URL and CONVEX_APP_TOKEN before scraping.");
    }
    return { siteUrl: siteUrl.replace(/\/$/, ""), token };
}
function compactRecord(record) {
    return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== null));
}
async function convexCall(path, args) {
    const { siteUrl, token } = getConfig();
    const response = await fetch(`${siteUrl}/api/mutation`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ path, args: { token, ...args } }),
        signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok)
        throw new Error(`Convex mutation failed with HTTP ${response.status}`);
    const body = (await response.json());
    if (!body.value)
        throw new Error("Convex mutation returned an invalid response");
    return body.value;
}
export function upsertIpo(record) {
    return convexCall("ipos:upsertIpo", compactRecord(record));
}
