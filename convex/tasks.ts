import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("tasks").collect();
  },
});

export const updateStatus = mutation({
  args: {
    taskId: v.id("tasks"),
    status: v.union(
      v.literal("Inbox"),
      v.literal("Assigned"),
      v.literal("In Progress"),
      v.literal("Review"),
      v.literal("Waiting"),
      v.literal("Done")
    ),
  },
  handler: async (ctx, args) => {
    // Enforce deliverable gate.
    if (args.status === "Done") {
      const del = await ctx.db
        .query("deliverables")
        .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
        .first();
      if (!del) {
        throw new Error("Cannot mark task Done without at least one deliverable.");
      }
    }

    await ctx.db.patch(args.taskId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return { ok: true };
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert("tasks", {
      title: args.title,
      description: args.description ?? "",
      status: "Inbox",
      assignedAgentIds: [],
      tags: args.tags ?? [],
      createdAt: now,
      updatedAt: now,
      impact: 3,
      confidence: 3,
      urgency: 3,
      effort: 3,
    });
    return { id };
  },
});

export const upsertManyExternal = mutation({
  args: {
    tasks: v.array(
      v.object({
        externalId: v.string(),
        title: v.string(),
        description: v.optional(v.string()),
        status: v.union(
          v.literal("Inbox"),
          v.literal("Assigned"),
          v.literal("In Progress"),
          v.literal("Review"),
          v.literal("Waiting"),
          v.literal("Done")
        ),
        tags: v.optional(v.array(v.string())),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let upserted = 0;
    for (const t of args.tasks) {
      const existing = await ctx.db
        .query("tasks")
        .withIndex("by_externalId", (q) => q.eq("externalId", t.externalId))
        .first();
      if (!existing) {
        await ctx.db.insert("tasks", {
          externalId: t.externalId,
          title: t.title,
          description: t.description ?? "",
          status: t.status,
          assignedAgentIds: [],
          tags: t.tags ?? [],
          createdAt: now,
          updatedAt: now,
          impact: 3,
          confidence: 3,
          urgency: 3,
          effort: 3,
        });
      } else {
        await ctx.db.patch(existing._id, {
          title: t.title,
          description: t.description ?? existing.description,
          status: t.status,
          tags: t.tags ?? existing.tags,
          updatedAt: now,
        });
      }
      upserted += 1;
    }
    return { upserted };
  },
});
