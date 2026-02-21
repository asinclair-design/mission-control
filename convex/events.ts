import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 40, 1), 200);
    const all = await ctx.db
      .query("events")
      .withIndex("by_createdAt")
      .order("desc")
      .take(limit);
    return all;
  },
});

export const append = mutation({
  args: {
    type: v.union(
      v.literal("message"),
      v.literal("deliverable"),
      v.literal("error"),
      v.literal("insight"),
      v.literal("approval"),
      v.literal("task")
    ),
    title: v.string(),
    detail: v.string(),
    priority: v.optional(v.union(v.literal("low"), v.literal("med"), v.literal("high"))),
    agentId: v.optional(v.id("agents")),
    taskId: v.optional(v.id("tasks")),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("events", {
      type: args.type,
      title: args.title,
      detail: args.detail,
      priority: args.priority,
      agentId: args.agentId,
      taskId: args.taskId,
      createdAt: Date.now(),
    });
    return { id };
  },
});
