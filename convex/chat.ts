import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 50, 1), 200);
    const msgs = await ctx.db.query("chatMessages").order("desc").take(limit);
    return msgs.reverse();
  },
});

export const send = mutation({
  args: {
    agentName: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("chatMessages", {
      agentName: args.agentName,
      message: args.message,
      createdAt: Date.now(),
    });
    return { id };
  },
});
