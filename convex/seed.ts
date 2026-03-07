import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Seed RP Group agents based on Matt's actual business needs.
// Safe to call multiple times; no-ops if agents already exist.
// Agents match Discord configuration.

export const seedIfEmpty = mutation({
  args: {
    now: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = args.now ?? Date.now();
    const existing = await ctx.db.query("agents").first();
    if (existing) return { seeded: false };

    // Agents matching Discord configuration
    const opsId = await ctx.db.insert("agents", {
      name: "Ops",
      role: "Operations & task management",
      status: "active",
      lastHeartbeatAt: now - 2 * 60_000,
      taskCount: 12,
      currentTask: "syncing ClickUp tasks",
      capabilities: ["operations", "task_management", "clickup_sync", "coordination"],
    });

    const salesScoutId = await ctx.db.insert("agents", {
      name: "Sales Scout",
      role: "BD, lead gen & outreach",
      status: "active",
      lastHeartbeatAt: now - 5 * 60_000,
      taskCount: 8,
      currentTask: "Reddit lead monitoring",
      capabilities: ["lead_generation", "outreach", "reddit_monitoring", "bd"],
    });

    const contentEngineId = await ctx.db.insert("agents", {
      name: "Content Engine",
      role: "Marketing & content creation",
      status: "active",
      lastHeartbeatAt: now - 8 * 60_000,
      taskCount: 6,
      currentTask: "LinkedIn content calendar",
      capabilities: ["content_creation", "marketing", "linkedin", "copywriting"],
    });

    const techAnalystId = await ctx.db.insert("agents", {
      name: "Tech Analyst",
      role: "Engineering & technical analysis",
      status: "idle",
      lastHeartbeatAt: now - 15 * 60_000,
      taskCount: 3,
      capabilities: ["technical_analysis", "engineering", "research", "evaluation"],
    });

    const financeId = await ctx.db.insert("agents", {
      name: "Finance",
      role: "Financial modeling & strategy",
      status: "idle",
      lastHeartbeatAt: now - 20 * 60_000,
      taskCount: 2,
      capabilities: ["financial_modeling", "strategy", "analysis", "forecasting"],
    });

    const builderId = await ctx.db.insert("agents", {
      name: "Builder",
      role: "SaaS platform & deployments",
      status: "active",
      lastHeartbeatAt: now - 3 * 60_000,
      taskCount: 4,
      currentTask: "Mission Control dashboard",
      capabilities: ["saas_development", "deployment", "architecture", "full_stack"],
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
      agentId: salesScoutId,
      title: "Reddit scan complete",
      detail: "49 relevant posts found. Top lead: r/CNC rust prevention (171 upvotes).",
      priority: "med",
      createdAt: now - 5 * 60_000,
    });

    await ctx.db.insert("events", {
      type: "message",
      agentId: contentEngineId,
      title: "LinkedIn post ready",
      detail: "Day 1 post ready: '6061-T6 Aluminum for Automotive Prototypes'. Needs image approval.",
      priority: "med",
      createdAt: now - 8 * 60_000,
    });

    await ctx.db.insert("events", {
      type: "message",
      agentId: builderId,
      title: "Mission Control deployed",
      detail: "v2.0 with Convex persistence, analytics, cron jobs, squad chat. Live at mission-control-rho-eight.vercel.app",
      priority: "med",
      createdAt: now - 3 * 60_000,
    });

    await ctx.db.insert("events", {
      type: "message",
      agentId: techAnalystId,
      title: "Tech stack evaluation complete",
      detail: "Evaluated 5 manufacturing SaaS platforms. Recommendation: custom build with Next.js + Supabase.",
      priority: "low",
      createdAt: now - 20 * 60_000,
    });

    // Seed chat messages
    await ctx.db.insert("chatMessages", {
      agentName: "Ops",
      message: "ClickUp sync is running smoothly. 41 tasks imported and tracking correctly.",
      createdAt: now - 12 * 60_000,
    });

    await ctx.db.insert("chatMessages", {
      agentName: "Builder",
      message: "Just deployed Mission Control v2.0. New features: agent registry, task kanban, live feed, squad chat.",
      createdAt: now - 9 * 60_000,
    });

    await ctx.db.insert("chatMessages", {
      agentName: "Sales Scout",
      message: "Found a hot lead on Reddit - r/CNC discussion about rust prevention with 171 upvotes. Should I reach out?",
      createdAt: now - 6 * 60_000,
    });

    await ctx.db.insert("chatMessages", {
      agentName: "Content Engine",
      message: "LinkedIn content calendar is set for the week. First post about 6061-T6 aluminum is ready for approval.",
      createdAt: now - 4 * 60_000,
    });

    // Seed mission statement
    await ctx.db.insert("team", {
      missionStatement: "Build an autonomous organization of AI agents that automate RP Group operations and manufacturing SaaS development, producing value 24/7",
      updatedAt: now,
    });

    // Seed initial projects from ClickUp list
    const manufacturingSaaSId = await ctx.db.insert("projects", {
      name: "Manufacturing SaaS Platform",
      description: "Multi-tenant manufacturing SaaS (Next.js + Python microservices + Supabase + AI tooling)",
      status: "active",
      priority: 10,
      progress: 35,
      googleDriveFolderId: "1JCC2gBEpP79gnJlpgKfzQX3GQ_frBwhC",
      googleDriveFolderUrl: "https://drive.google.com/drive/folders/1JCC2gBEpP79gnJlpgKfzQX3GQ_frBwhC",
      taskIds: [],
      createdAt: now,
      updatedAt: now,
    });

    const rpGroupOpsId = await ctx.db.insert("projects", {
      name: "RP Group Operations Automation",
      description: "Automate RP Group operations: quoting, customer follow-ups, lead tracking, documentation",
      status: "active",
      priority: 9,
      progress: 25,
      taskIds: [],
      createdAt: now,
      updatedAt: now,
    });

    const salesMarketingId = await ctx.db.insert("projects", {
      name: "Sales & Marketing Engine",
      description: "Reddit monitoring, LinkedIn content, lead generation, email campaigns",
      status: "active",
      priority: 8,
      progress: 40,
      taskIds: [],
      createdAt: now,
      updatedAt: now,
    });

    // ElderCare Assist - paused
    await ctx.db.insert("projects", {
      name: "ElderCare Assist",
      description: "Healthcare/assisted living marketplace project — ON HOLD",
      status: "paused",
      priority: 3,
      progress: 15,
      taskIds: [],
      createdAt: now,
      updatedAt: now,
    });

    // Seed some initial memories
    await ctx.db.insert("memories", {
      date: new Date(now).toISOString().split('T')[0],
      content: "Mission Control v2.0 deployed with Discord agent integration. Agents now match Discord configuration: Ops, Sales Scout, Content Engine, Tech Analyst, Finance, Builder.",
      summary: "Discord agents integrated into Mission Control",
      projectIds: [manufacturingSaaSId],
      tags: ["agents", "discord", "mission-control"],
      createdAt: now,
    });

    return { seeded: true };
  },
});

// Clear all data (use to reset for fresh seed)
export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    let deleted = 0;
    
    // Delete from each table
    const agents = await ctx.db.query("agents").collect();
    for (const doc of agents) { await ctx.db.delete(doc._id); deleted++; }
    
    const tasks = await ctx.db.query("tasks").collect();
    for (const doc of tasks) { await ctx.db.delete(doc._id); deleted++; }
    
    const deliverables = await ctx.db.query("deliverables").collect();
    for (const doc of deliverables) { await ctx.db.delete(doc._id); deleted++; }
    
    const events = await ctx.db.query("events").collect();
    for (const doc of events) { await ctx.db.delete(doc._id); deleted++; }
    
    const cronJobs = await ctx.db.query("cronJobs").collect();
    for (const doc of cronJobs) { await ctx.db.delete(doc._id); deleted++; }
    
    const chatMessages = await ctx.db.query("chatMessages").collect();
    for (const doc of chatMessages) { await ctx.db.delete(doc._id); deleted++; }
    
    const leads = await ctx.db.query("leads").collect();
    for (const doc of leads) { await ctx.db.delete(doc._id); deleted++; }
    
    const projects = await ctx.db.query("projects").collect();
    for (const doc of projects) { await ctx.db.delete(doc._id); deleted++; }
    
    const calendarEvents = await ctx.db.query("calendarEvents").collect();
    for (const doc of calendarEvents) { await ctx.db.delete(doc._id); deleted++; }
    
    const memories = await ctx.db.query("memories").collect();
    for (const doc of memories) { await ctx.db.delete(doc._id); deleted++; }
    
    const documents = await ctx.db.query("documents").collect();
    for (const doc of documents) { await ctx.db.delete(doc._id); deleted++; }
    
    const team = await ctx.db.query("team").collect();
    for (const doc of team) { await ctx.db.delete(doc._id); deleted++; }
    
    return { deleted };
  },
});

// Force reseed - clears agents and re-seeds with correct Discord agents
export const forceReseedAgents = mutation({
  args: {
    now: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = args.now ?? Date.now();
    const inserted = [];
    
    // Seed new agents matching Discord configuration
    // Note: This will fail if agents with these names already exist
    try {
      await ctx.db.insert("agents", {
        name: "Ops",
        role: "Operations & task management",
        status: "active",
        lastHeartbeatAt: now - 2 * 60_000,
        taskCount: 12,
        currentTask: "syncing ClickUp tasks",
        capabilities: ["operations", "task_management", "clickup_sync", "coordination"],
      });
      inserted.push("Ops");
    } catch (e) {
      // Agent may already exist
    }

    try {
      await ctx.db.insert("agents", {
        name: "Sales Scout",
        role: "BD, lead gen & outreach",
        status: "active",
        lastHeartbeatAt: now - 5 * 60_000,
        taskCount: 8,
        currentTask: "Reddit lead monitoring",
        capabilities: ["lead_generation", "outreach", "reddit_monitoring", "bd"],
      });
      inserted.push("Sales Scout");
    } catch (e) {
      // Agent may already exist
    }

    try {
      await ctx.db.insert("agents", {
        name: "Content Engine",
        role: "Marketing & content creation",
        status: "active",
        lastHeartbeatAt: now - 8 * 60_000,
        taskCount: 6,
        currentTask: "LinkedIn content calendar",
        capabilities: ["content_creation", "marketing", "linkedin", "copywriting"],
      });
      inserted.push("Content Engine");
    } catch (e) {
      // Agent may already exist
    }

    try {
      await ctx.db.insert("agents", {
        name: "Tech Analyst",
        role: "Engineering & technical analysis",
        status: "idle",
        lastHeartbeatAt: now - 15 * 60_000,
        taskCount: 3,
        capabilities: ["technical_analysis", "engineering", "research", "evaluation"],
      });
      inserted.push("Tech Analyst");
    } catch (e) {
      // Agent may already exist
    }

    try {
      await ctx.db.insert("agents", {
        name: "Finance",
        role: "Financial modeling & strategy",
        status: "idle",
        lastHeartbeatAt: now - 20 * 60_000,
        taskCount: 2,
        capabilities: ["financial_modeling", "strategy", "analysis", "forecasting"],
      });
      inserted.push("Finance");
    } catch (e) {
      // Agent may already exist
    }

    try {
      await ctx.db.insert("agents", {
        name: "Builder",
        role: "SaaS platform & deployments",
        status: "active",
        lastHeartbeatAt: now - 3 * 60_000,
        taskCount: 4,
        currentTask: "Mission Control dashboard",
        capabilities: ["saas_development", "deployment", "architecture", "full_stack"],
      });
      inserted.push("Builder");
    } catch (e) {
      // Agent may already exist
    }

    return { 
      reseeded: true, 
      inserted,
      message: "Agents added. Use 'Reset All Data' first if you need to clear existing agents."
    };
  },
});
