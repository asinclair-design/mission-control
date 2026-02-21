import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Seed initial demo data once, so the deployed app has something to show.
// Safe to call multiple times; it will no-op if agents already exist.

export const seedIfEmpty = mutation({
  args: {
    now: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = args.now ?? Date.now();
    const existing = await ctx.db.query("agents").first();
    if (existing) return { seeded: false };

    const orchestratorId = await ctx.db.insert("agents", {
      name: "Orchestrator",
      role: "Jarvis-type coordinator",
      status: "active",
      lastHeartbeatAt: now - 60_000,
      taskCount: 7,
      currentTask: "triaging mission queue",
      capabilities: ["broadcast", "assign", "aggregate"],
    });

    const scoutId = await ctx.db.insert("agents", {
      name: "Scout",
      role: "Research & synthesis",
      status: "active",
      lastHeartbeatAt: now - 3 * 60_000,
      taskCount: 4,
      currentTask: "finding podcast targets",
      capabilities: ["web_research", "summaries"],
    });

    const builderId = await ctx.db.insert("agents", {
      name: "Builder",
      role: "Implementation",
      status: "idle",
      lastHeartbeatAt: now - 9 * 60_000,
      taskCount: 2,
      capabilities: ["git", "deploy"],
    });

    const gatekeeperId = await ctx.db.insert("agents", {
      name: "Gatekeeper",
      role: "Review & approvals",
      status: "idle",
      lastHeartbeatAt: now - 12 * 60_000,
      taskCount: 1,
      capabilities: ["review", "approve"],
    });

    const sentinelId = await ctx.db.insert("agents", {
      name: "Sentinel",
      role: "Monitoring & alerts",
      status: "error",
      lastHeartbeatAt: now - 18 * 60_000,
      taskCount: 3,
      currentTask: "reddit monitor cron",
      capabilities: ["monitoring"],
    });

    const t1 = await ctx.db.insert("tasks", {
      externalId: "MC-001",
      title: "Stand up Mission Control MVP UI",
      description:
        "Left agent registry, kanban queue, live feed, broadcast console. Convex persistence.",
      status: "In Progress",
      assignedAgentIds: [orchestratorId, builderId],
      tags: ["mvp", "ui", "nextjs", "convex"],
      createdAt: now - 52 * 60_000,
      updatedAt: now - 12 * 60_000,
      impact: 5,
      confidence: 4,
      urgency: 4,
      effort: 3,
    });

    const t2 = await ctx.db.insert("tasks", {
      externalId: "MC-002",
      title: "Define agent protocol contract",
      description:
        "heartbeat(), fetch_new_tasks(), post_updates(), submit_deliverable(), ask_question().",
      status: "Review",
      assignedAgentIds: [orchestratorId, gatekeeperId],
      tags: ["spec", "protocol"],
      createdAt: now - 140 * 60_000,
      updatedAt: now - 20 * 60_000,
      impact: 4,
      confidence: 4,
      urgency: 3,
      effort: 2,
    });

    await ctx.db.insert("deliverables", {
      taskId: t2,
      kind: "Markdown",
      title: "Protocol spec",
      createdAt: now - 18 * 60_000,
      createdByAgentId: gatekeeperId,
    });

    await ctx.db.insert("tasks", {
      externalId: "MC-003",
      title: "Prioritization engine formula",
      description:
        "priority_score = impact × confidence × urgency ÷ effort; display rank + color.",
      status: "Assigned",
      assignedAgentIds: [scoutId],
      tags: ["scoring"],
      createdAt: now - 23 * 60_000,
      updatedAt: now - 10 * 60_000,
      impact: 3,
      confidence: 5,
      urgency: 2,
      effort: 1,
    });

    await ctx.db.insert("tasks", {
      externalId: "MC-004",
      title: "Audit log + event schema",
      description: "Define append-only event table + severity mapping.",
      status: "Inbox",
      assignedAgentIds: [],
      tags: ["db"],
      createdAt: now - 8 * 60_000,
      updatedAt: now - 8 * 60_000,
      impact: 4,
      confidence: 3,
      urgency: 2,
      effort: 2,
    });

    await ctx.db.insert("events", {
      type: "message",
      agentId: orchestratorId,
      title: "Queue synced",
      detail: "Pulled tasks, re-ranked by urgency.",
      priority: "med",
      createdAt: now - 60_000,
    });

    await ctx.db.insert("events", {
      type: "deliverable",
      agentId: scoutId,
      title: "Deliverable uploaded",
      detail: "Podcast target list (v1).",
      priority: "low",
      createdAt: now - 4 * 60_000,
    });

    await ctx.db.insert("events", {
      type: "error",
      agentId: sentinelId,
      title: "Cron error",
      detail: "Reddit monitor produced results but flagged error state (needs retry logic).",
      priority: "high",
      createdAt: now - 9 * 60_000,
    });

    await ctx.db.insert("events", {
      type: "approval",
      agentId: gatekeeperId,
      title: "Approval needed",
      detail: "Approve posting draft response on r/InjectionMolding.",
      priority: "med",
      createdAt: now - 12 * 60_000,
    });

    return { seeded: true };
  },
});
