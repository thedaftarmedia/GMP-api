import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

function authorize(token: string) {
  const expected = process.env.CONVEX_APP_TOKEN;
  if (!expected || token !== expected) throw new Error("Unauthorized");
}

const optionalNumber = v.optional(v.number());

export const listIpos = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    authorize(args.token);
    return await ctx.db
      .query("ipos")
      .withIndex("by_updatedAt")
      .order("desc")
      .take(500);
  },
});

export const getIpo = query({
  args: { token: v.string(), id: v.id("ipos") },
  handler: async (ctx, args) => {
    authorize(args.token);
    return await ctx.db.get(args.id);
  },
});

export const upsertIpo = mutation({
  args: {
    token: v.string(),
    name: v.string(),
    category: v.union(v.literal("mainboard"), v.literal("sme")),
    status: v.string(),
    price: optionalNumber,
    gmp: optionalNumber,
    gmpPercentage: optionalNumber,
    estimatedListing: optionalNumber,
    estimatedListingPercentage: optionalNumber,
    expectedProfit: optionalNumber,
    profitType: v.optional(v.union(v.literal("profit"), v.literal("loss"))),
    lotSize: optionalNumber,
    issueSize: optionalNumber,
    subscription: optionalNumber,
    biddingStartDate: v.optional(v.string()),
    biddingEndDate: v.optional(v.string()),
    sourceUrl: v.optional(v.string()),
    sourceId: v.string(),
    scrapedAt: v.string(),
    updatedAt: v.string(),
    lastSeenAt: v.string(),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    authorize(args.token);
    const { token: _token, ...record } = args;
    const existing = await ctx.db
      .query("ipos")
      .withIndex("by_sourceId", (q) => q.eq("sourceId", record.sourceId))
      .unique();

    const gmpChanged =
      !existing ||
      existing.gmp !== record.gmp ||
      existing.gmpPercentage !== record.gmpPercentage;
    const ipoId = existing
      ? existing._id
      : await ctx.db.insert("ipos", record);
    if (existing) await ctx.db.patch(existing._id, record);

    if (gmpChanged) {
      await ctx.db.insert("gmpHistory", {
        ipoId,
        sourceId: record.sourceId,
        gmp: record.gmp,
        gmpPercentage: record.gmpPercentage,
        recordedAt: record.updatedAt,
      });
    }

    return {
      id: ipoId,
      action: existing ? "updated" : "created",
      historyCreated: gmpChanged,
    };
  },
});