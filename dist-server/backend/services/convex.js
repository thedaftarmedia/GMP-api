// export class ConvexUnavailable extends Error {
//   constructor(message = "Convex is unavailable") {
//     super(message);
//     this.name = "ConvexUnavailable";
//   }
// }
// type ConvexFunctionType = "query" | "mutation";
// interface ConvexResponse<T> {
//   value?: T;
// }
// export async function callConvex<T>(
//   functionType: ConvexFunctionType,
//   path: string,
//   args: Record<string, unknown>,
// ): Promise<T> {
//   const convexUrl = process.env.CONVEX_URL;
//   const token = process.env.CONVEX_APP_TOKEN;
//   if (!convexUrl || !token) throw new ConvexUnavailable("Convex is not configured");
//   try {
//     const response = await fetch(`${convexUrl.replace(/\/$/, "")}/api/${functionType}`, {
//       method: "POST",
//       headers: { "content-type": "application/json" },
//       body: JSON.stringify({ path, args: { token, ...args } }),
//       signal: AbortSignal.timeout(12_000),
//     });
//     if (!response.ok) throw new ConvexUnavailable(`Convex returned HTTP ${response.status}`);
//     const body = (await response.json()) as ConvexResponse<T>;
//     if (body.value === undefined) throw new ConvexUnavailable("Convex returned an invalid response");
//     return body.value;
//   } catch (error) {
//     if (error instanceof ConvexUnavailable) throw error;
//     throw new ConvexUnavailable("Convex is temporarily unavailable");
//   }
// }
export class ConvexUnavailable extends Error {
    constructor(message = "Convex is unavailable") {
        super(message);
        this.name = "ConvexUnavailable";
    }
}
export async function callConvex(functionType, path, args) {
    const convexUrl = process.env.CONVEX_URL;
    const token = process.env.CONVEX_APP_TOKEN;
    if (!convexUrl || !token) {
        throw new ConvexUnavailable("Convex is not configured");
    }
    try {
        const response = await fetch(`${convexUrl.replace(/\/$/, "")}/api/${functionType}`, {
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
            signal: AbortSignal.timeout(12_000),
        });
        if (!response.ok) {
            const errorBody = await response.text();
            throw new ConvexUnavailable(`Convex returned HTTP ${response.status}: ${errorBody}`);
        }
        const body = (await response.json());
        if (body.status === "error") {
            throw new ConvexUnavailable(body.errorMessage ??
                "Convex returned an error");
        }
        if (body.value === undefined) {
            throw new ConvexUnavailable("Convex returned an invalid response");
        }
        return body.value;
    }
    catch (error) {
        if (error instanceof ConvexUnavailable) {
            throw error;
        }
        throw new ConvexUnavailable("Convex is temporarily unavailable");
    }
}
