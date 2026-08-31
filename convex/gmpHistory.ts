import { v } from "convex/values";
import { query } from "./_generated/server";

function authorize(token: string) {
  const expected = process.env.CONVEX_APP_TOKEN;
  if (!expected || token !== expected) throw new Error("Unauthorized");
}

export const listHistory = query({
  args: { token: v.string(), sourceId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    authorize(args.token);
    return await ctx.db
      .query("gmpHistory")
      .withIndex("by_sourceId_recordedAt", (q) => q.eq("sourceId", args.sourceId))
      .order("desc")
      .take(Math.min(args.limit ?? 100, 500));
  },
});