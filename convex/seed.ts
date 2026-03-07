import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Seed RP Group agents based on Matt's actual business needs.
// Safe to call multiple times; no-ops if agents already exist.
// Agents match Discord configuration in /agents folder.

export const seedIfEmpty = mutation({
  args: {
    now: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = args.now ?? Date.now();
    const existing = await ctx.db.query("agents").first();
    if (existing) return { seeded: false };

    // Agents matching Discord configuration
    const mainId = await ctx.db.insert("agents", {
      name: "main",
      role: "Orchestrator - coordinates all agents and routes requests",
      status: "active",
      lastHeartbeatAt: now - 2 * 60_000,
      taskCount: 15,
      currentTask: "coordinating agent tasks",
      capabilities: ["orchestration", "routing", "tracking", "escalation"],
    });

    const manufacturingId = await ctx.db.insert("agents", {
      name: "manufacturing",
      role: "Manufacturing expert - IATF 16949, PT builds, automotive processes",
      status: "active",
      lastHeartbeatAt: now - 5 * 60_000,
      taskCount: 8,
      currentTask: "quality compliance review",
      capabilities: ["iatf_16949", "pt_builds", "quality_management", "process_optimization"],
    });

    const quotingId = await ctx.db.insert("agents", {
      name: "quoting",
      role: "Quoting specialist - cost modeling, RFQ responses, pricing",
      status: "active",
      lastHeartbeatAt: now - 8 * 60_000,
      taskCount: 6,
      currentTask: "PT quote for Tesla RFQ",
      capabilities: ["cost_modeling", "rfq_response", "pricing_strategy", "parametric_quotes"],
    });

    const saasArchitectId = await ctx.db.insert("agents", {
      name: "saas-architect",
      role: "SaaS architect - Next.js, Python, Supabase, AI integration",
      status: "active",
      lastHeartbeatAt: now - 3 * 60_000,
      taskCount: 12,
      currentTask: "Mission Control dashboard improvements",
      capabilities: ["nextjs", "python", "supabase", "ai_integration", "architecture"],
    });

    const codeReviewerId = await ctx.db.insert("agents", {
      name: "code-reviewer",
      role: "Code reviewer - quality, security, best practices",
      status: "idle",
      lastHeartbeatAt: now - 15 * 60_000,
      taskCount: 3,
      capabilities: ["code_review", "security_audit", "quality_assurance", "best_practices"],
    });

    const researchId = await ctx.db.insert("agents", {
      name: "research",
      role: "Research analyst - market research, competitive analysis",
      status: "active",
      lastHeartbeatAt: now - 20 * 60_000,
      taskCount: 4,
      currentTask: "EV market trends analysis",
      capabilities: ["market_research", "competitive_analysis", "technology_evaluation", "trend_monitoring"],
    });

    // Seed some initial events
    await ctx.db.insert("events", {
      type: "message",
      agentId: mainId,
      title: "Agent files system deployed",
      detail: "Added agent file viewer/editor to Mission Control. Can now view and edit AGENT.md, SOUL.md, MEMORY.md for all agents.",
      priority: "med",
      createdAt: now - 2 * 60_000,
    });

    await ctx.db.insert("events", {
      type: "message",
      agentId: manufacturingId,
      title: "IATF audit prep complete",
      detail: "All documentation ready for customer quality audit. Control plans updated.",
      priority: "med",
      createdAt: now - 5 * 60_000,
    });

    await ctx.db.insert("events", {
      type: "message",
      agentId: quotingId,
      title: "RFQ response submitted",
      detail: "Tesla PT build quote submitted. 24-hour turnaround achieved.",
      priority: "med",
      createdAt: now - 8 * 60_000,
    });

    await ctx.db.insert("events", {
      type: "message",
      agentId: saasArchitectId,
      title: "Mission Control v2.1 deployed",
      detail: "Collapsible panels and agent file editor now live.",
      priority: "med",
      createdAt: now - 3 * 60_000,
    });

    await ctx.db.insert("events", {
      type: "message",
      agentId: researchId,
      title: "EV market report ready",
      detail: "Q1 2026 EV manufacturing trends analysis complete. Key findings: 23% growth in APAC.",
      priority: "low",
      createdAt: now - 20 * 60_000,
    });

    // Seed chat messages
    await ctx.db.insert("chatMessages", {
      agentName: "main",
      message: "All agent files have been updated with Anthropic best practices. Each agent now has comprehensive AGENT.md and SOUL.md documentation.",
      createdAt: now - 12 * 60_000,
    });

    await ctx.db.insert("chatMessages", {
      agentName: "saas-architect",
      message: "Just deployed the agent file editor to Mission Control. You can now click 'Files' on any agent to view and edit their configuration.",
      createdAt: now - 9 * 60_000,
    });

    await ctx.db.insert("chatMessages", {
      agentName: "manufacturing",
      message: "Tesla's new drawing revision is in. Need to review tolerance changes and update control plan.",
      createdAt: now - 6 * 60_000,
    });

    await ctx.db.insert("chatMessages", {
      agentName: "quoting",
      message: "Working on the Lear RFQ. Complex assembly with 12 components. Should have preliminary costs by EOD.",
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
      content: "Updated all agent documentation following Anthropic best practices. Each agent now has detailed AGENT.md (role, responsibilities, boundaries) and SOUL.md (identity, voice, beliefs).",
      summary: "Agent documentation overhaul complete",
      projectIds: [manufacturingSaaSId],
      tags: ["agents", "documentation", "anthropic-best-practices"],
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
        name: "main",
        role: "Orchestrator - coordinates all agents and routes requests",
        status: "active",
        lastHeartbeatAt: now - 2 * 60_000,
        taskCount: 15,
        currentTask: "coordinating agent tasks",
        capabilities: ["orchestration", "routing", "tracking", "escalation"],
      });
      inserted.push("main");
    } catch (e) {
      // Agent may already exist
    }

    try {
      await ctx.db.insert("agents", {
        name: "manufacturing",
        role: "Manufacturing expert - IATF 16949, PT builds, automotive processes",
        status: "active",
        lastHeartbeatAt: now - 5 * 60_000,
        taskCount: 8,
        currentTask: "quality compliance review",
        capabilities: ["iatf_16949", "pt_builds", "quality_management", "process_optimization"],
      });
      inserted.push("manufacturing");
    } catch (e) {
      // Agent may already exist
    }

    try {
      await ctx.db.insert("agents", {
        name: "quoting",
        role: "Quoting specialist - cost modeling, RFQ responses, pricing",
        status: "active",
        lastHeartbeatAt: now - 8 * 60_000,
        taskCount: 6,
        currentTask: "PT quote for Tesla RFQ",
        capabilities: ["cost_modeling", "rfq_response", "pricing_strategy", "parametric_quotes"],
      });
      inserted.push("quoting");
    } catch (e) {
      // Agent may already exist
    }

    try {
      await ctx.db.insert("agents", {
        name: "saas-architect",
        role: "SaaS architect - Next.js, Python, Supabase, AI integration",
        status: "active",
        lastHeartbeatAt: now - 3 * 60_000,
        taskCount: 12,
        currentTask: "Mission Control dashboard improvements",
        capabilities: ["nextjs", "python", "supabase", "ai_integration", "architecture"],
      });
      inserted.push("saas-architect");
    } catch (e) {
      // Agent may already exist
    }

    try {
      await ctx.db.insert("agents", {
        name: "code-reviewer",
        role: "Code reviewer - quality, security, best practices",
        status: "idle",
        lastHeartbeatAt: now - 15 * 60_000,
        taskCount: 3,
        capabilities: ["code_review", "security_audit", "quality_assurance", "best_practices"],
      });
      inserted.push("code-reviewer");
    } catch (e) {
      // Agent may already exist
    }

    try {
      await ctx.db.insert("agents", {
        name: "research",
        role: "Research analyst - market research, competitive analysis",
        status: "active",
        lastHeartbeatAt: now - 20 * 60_000,
        taskCount: 4,
        currentTask: "EV market trends analysis",
        capabilities: ["market_research", "competitive_analysis", "technology_evaluation", "trend_monitoring"],
      });
      inserted.push("research");
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
