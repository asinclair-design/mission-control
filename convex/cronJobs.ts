import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("cronJobs").collect();
  },
});

export const upsertMany = mutation({
  args: {
    jobs: v.array(
      v.object({
        cronId: v.string(),
        name: v.string(),
        scheduleText: v.string(),
        status: v.optional(v.string()),
        lastRunAt: v.optional(v.number()),
        nextRunAt: v.optional(v.number()),
        lastError: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let upserted = 0;
    for (const j of args.jobs) {
      const existing = await ctx.db
        .query("cronJobs")
        .withIndex("by_cronId", (q) => q.eq("cronId", j.cronId))
        .first();
      if (!existing) {
        await ctx.db.insert("cronJobs", {
          ...j,
          createdAt: now,
          updatedAt: now,
        });
      } else {
        await ctx.db.patch(existing._id, {
          ...j,
          updatedAt: now,
        });
      }
      upserted += 1;
    }
    return { upserted };
  },
});
