import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("agents").collect();
  },
});

export const upsertHeartbeat = mutation({
  args: {
    name: v.string(),
    role: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("idle"),
      v.literal("error"),
      v.literal("paused")
    ),
    taskCount: v.optional(v.number()),
    currentTask: v.optional(v.string()),
    capabilities: v.optional(v.array(v.string())),
    at: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const at = args.at ?? Date.now();
    const existing = await ctx.db
      .query("agents")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();

    if (!existing) {
      const id = await ctx.db.insert("agents", {
        name: args.name,
        role: args.role,
        status: args.status,
        lastHeartbeatAt: at,
        taskCount: args.taskCount ?? 0,
        currentTask: args.currentTask,
        capabilities: args.capabilities,
      });
      return { created: true, id };
    }

    await ctx.db.patch(existing._id, {
      role: args.role,
      status: args.status,
      lastHeartbeatAt: at,
      taskCount: args.taskCount ?? existing.taskCount,
      currentTask: args.currentTask,
      capabilities: args.capabilities,
    });

    return { created: false, id: existing._id };
  },
});
