import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listByTask = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("deliverables")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
  },
});

export const create = mutation({
  args: {
    taskId: v.id("tasks"),
    kind: v.union(
      v.literal("Markdown"),
      v.literal("URL"),
      v.literal("JSON"),
      v.literal("Screenshot"),
      v.literal("PDF")
    ),
    title: v.string(),
    href: v.optional(v.string()),
    payload: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("deliverables", {
      taskId: args.taskId,
      kind: args.kind,
      title: args.title,
      href: args.href,
      payload: args.payload,
      createdAt: Date.now(),
    });
    return { id };
  },
});
