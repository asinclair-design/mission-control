import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const ingest = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    source: v.optional(v.string()),
    intent: v.optional(v.string()),
    ts: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Basic de-dupe by email (keep first record; update metadata on repeat).
    const existing = await ctx.db
      .query("leads")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name ?? existing.name,
        source: args.source ?? existing.source,
        intent: args.intent ?? existing.intent,
        ts: args.ts ?? existing.ts,
      });
      return { id: existing._id, deduped: true };
    }

    const id = await ctx.db.insert("leads", {
      email: args.email,
      name: args.name,
      source: args.source,
      intent: args.intent,
      ts: args.ts,
      createdAt: now,
    });

    return { id, deduped: false };
  },
});

export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(200, Math.max(1, args.limit ?? 50));
    const rows = await ctx.db
      .query("leads")
      .withIndex("by_createdAt", (q) => q)
      .order("desc")
      .take(limit);
    return rows;
  },
});
