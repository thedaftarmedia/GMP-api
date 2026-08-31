function getConfig() {
    const convexUrl = process.env.CONVEX_URL;
    const token = process.env.CONVEX_APP_TOKEN;
    if (!convexUrl || !token) {
        throw new Error("Convex is not configured. Set CONVEX_URL and CONVEX_APP_TOKEN before scraping.");
    }
    return {
        convexUrl: convexUrl.replace(/\/$/, ""),
        token,
    };
}
function compactRecord(record) {
    return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== null));
}
async function convexCall(path, args) {
    const { convexUrl, token } = getConfig();
    const response = await fetch(`${convexUrl}/api/mutation`, {
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
    });
    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Convex mutation failed with HTTP ${response.status}: ${errorBody}`);
    }
    const body = (await response.json());
    if (body.status === "error") {
        throw new Error(body.errorMessage ??
            "Convex mutation returned an error");
    }
    if (!body.value) {
        throw new Error("Convex mutation returned an invalid response");
    }
    return body.value;
}
export function upsertIpo(record) {
    return convexCall("ipos:upsertIpo", compactRecord(record));
}
