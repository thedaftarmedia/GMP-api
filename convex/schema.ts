import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ipos: defineTable({
    name: v.string(),
    category: v.union(v.literal("mainboard"), v.literal("sme")),
    status: v.string(),
    price: v.optional(v.number()),
    gmp: v.optional(v.number()),
    gmpPercentage: v.optional(v.number()),
    estimatedListing: v.optional(v.number()),
    estimatedListingPercentage: v.optional(v.number()),
    expectedProfit: v.optional(v.number()),
    profitType: v.optional(v.union(v.literal("profit"), v.literal("loss"))),
    lotSize: v.optional(v.number()),
    issueSize: v.optional(v.number()),
    subscription: v.optional(v.number()),
    biddingStartDate: v.optional(v.string()),
    biddingEndDate: v.optional(v.string()),
    sourceUrl: v.optional(v.string()),
    sourceId: v.string(),
    scrapedAt: v.string(),
    updatedAt: v.string(),
    lastSeenAt: v.string(),
    active: v.boolean(),
  })
    .index("by_sourceId", ["sourceId"])
    .index("by_category", ["category"])
    .index("by_status", ["status"])
    .index("by_updatedAt", ["updatedAt"]),
  gmpHistory: defineTable({
    ipoId: v.id("ipos"),
    sourceId: v.string(),
    gmp: v.optional(v.number()),
    gmpPercentage: v.optional(v.number()),
    recordedAt: v.string(),
  })
    .index("by_ipoId_recordedAt", ["ipoId", "recordedAt"])
    .index("by_sourceId_recordedAt", ["sourceId", "recordedAt"]),
});