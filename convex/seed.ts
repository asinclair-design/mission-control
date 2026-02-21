import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Seed RP Group agents based on Matt's actual business needs.
// Safe to call multiple times; no-ops if agents already exist.

export const seedIfEmpty = mutation({
  args: {
    now: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = args.now ?? Date.now();
    const existing = await ctx.db.query("agents").first();
    if (existing) return { seeded: false };

    // Real agents based on RP Group business context
    const opsId = await ctx.db.insert("agents", {
      name: "Ops",
      role: "Operations & task management",
      status: "active",
      lastHeartbeatAt: now - 2 * 60_000,
      taskCount: 12,
      currentTask: "syncing ClickUp tasks",
      capabilities: ["clickup", "email_triage", "calendar", "task_routing"],
    });

    const salesId = await ctx.db.insert("agents", {
      name: "Sales Scout",
      role: "BD, lead gen & outreach",
      status: "active",
      lastHeartbeatAt: now - 5 * 60_000,
      taskCount: 8,
      currentTask: "Reddit lead monitoring",
      capabilities: ["web_research", "reddit", "linkedin", "lead_scoring"],
    });

    const marketerId = await ctx.db.insert("agents", {
      name: "Content Engine",
      role: "Marketing & content creation",
      status: "active",
      lastHeartbeatAt: now - 8 * 60_000,
      taskCount: 6,
      currentTask: "LinkedIn content calendar",
      capabilities: ["copywriting", "social_media", "ebook_gen", "image_gen"],
    });

    const engineerId = await ctx.db.insert("agents", {
      name: "Tech Analyst",
      role: "Engineering & technical analysis",
      status: "idle",
      lastHeartbeatAt: now - 15 * 60_000,
      taskCount: 3,
      capabilities: ["material_analysis", "tolerance_review", "quoting", "dfm"],
    });

    const financeId = await ctx.db.insert("agents", {
      name: "Finance",
      role: "Financial modeling & strategy",
      status: "idle",
      lastHeartbeatAt: now - 20 * 60_000,
      taskCount: 2,
      capabilities: ["valuation", "scenario_modeling", "cashflow", "forecasting"],
    });

    const builderId = await ctx.db.insert("agents", {
      name: "Builder",
      role: "SaaS platform & deployments",
      status: "active",
      lastHeartbeatAt: now - 3 * 60_000,
      taskCount: 4,
      currentTask: "Mission Control dashboard",
      capabilities: ["nextjs", "python", "supabase", "vercel", "github"],
    });

    // Seed some initial events
    await ctx.db.insert("events", {
      type: "message",
      agentId: opsId,
      title: "ClickUp sync complete",
      detail: "Imported 41 tasks from ClickUp list 901816091727. Mapped statuses: 7 In Progress, 24 Assigned, 4 Inbox, 6 Done.",
      priority: "med",
      createdAt: now - 2 * 60_000,
    });

    await ctx.db.insert("events", {
      type: "message",
      agentId: salesId,
      title: "Reddit scan complete",
      detail: "49 relevant posts found. Top lead: r/CNC rust prevention (171 upvotes).",
      priority: "low",
      createdAt: now - 5 * 60_000,
    });

    await ctx.db.insert("events", {
      type: "approval",
      agentId: marketerId,
      title: "LinkedIn post ready",
      detail: "Day 1 post ready: '6061-T6 Aluminum for Automotive Prototypes'. Needs image approval.",
      priority: "med",
      createdAt: now - 8 * 60_000,
    });

    await ctx.db.insert("events", {
      type: "error",
      agentId: salesId,
      title: "Cron delivery failed",
      detail: "Reddit monitor cron: 'cron delivery target is missing'. Fix: configure Discord announce channel.",
      priority: "high",
      createdAt: now - 10 * 60_000,
    });

    await ctx.db.insert("events", {
      type: "task",
      agentId: builderId,
      title: "Mission Control deployed",
      detail: "v2.0 with Convex persistence, analytics, cron jobs, squad chat. Live at mission-control-rho-eight.vercel.app",
      priority: "med",
      createdAt: now - 3 * 60_000,
    });

    // Seed chat messages
    await ctx.db.insert("chatMessages", {
      agentName: "Sales Scout",
      message: "Found a hot lead on r/MechanicalEngineering — someone asking about tolerances and cost for automotive prototypes. 49 upvotes, 77 comments. RP Group could add real value here.",
      createdAt: now - 12 * 60_000,
    });

    await ctx.db.insert("chatMessages", {
      agentName: "Content Engine",
      message: "Today's LinkedIn post is ready: '6061-T6 Aluminum for Automotive Prototypes'. Need Matt to approve an image or I'll go text-only.",
      createdAt: now - 9 * 60_000,
    });

    await ctx.db.insert("chatMessages", {
      agentName: "Ops",
      message: "4 cron jobs are erroring with 'delivery target missing'. Looks like the Discord announce channel needs to be configured. @Builder can you check?",
      createdAt: now - 6 * 60_000,
    });

    await ctx.db.insert("chatMessages", {
      agentName: "Builder",
      message: "On it. Also just deployed Mission Control v2.0 — Convex persistence is live. All ClickUp tasks synced.",
      createdAt: now - 4 * 60_000,
    });

    return { seeded: true };
  },
});

// Clear all data (use to reset for fresh seed)
export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const tables = ["agents", "tasks", "deliverables", "events", "cronJobs", "chatMessages"] as const;
    let deleted = 0;
    for (const table of tables) {
      const docs = await ctx.db.query(table).collect();
      for (const doc of docs) {
        await ctx.db.delete(doc._id);
        deleted++;
      }
    }
    return { deleted };
  },
});
