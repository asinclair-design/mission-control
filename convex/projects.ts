import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Projects
export const listProjects = query({
  args: {},
  handler: async (ctx) => {
    const projects = await ctx.db.query("projects").collect();
    return projects.sort((a, b) => b.priority - a.priority);
  },
});

export const getProject = query({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const createProject = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    priority: v.optional(v.number()),
    googleDriveFolderId: v.optional(v.string()),
    googleDriveFolderUrl: v.optional(v.string()),
    externalId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("projects", {
      ...args,
      description: args.description || "",
      priority: args.priority || 5,
      progress: 0,
      status: "active",
      taskIds: [],
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateProjectStatus = mutation({
  args: {
    projectId: v.id("projects"),
    status: v.union(v.literal("active"), v.literal("paused"), v.literal("completed")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.projectId, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

export const updateProjectPriority = mutation({
  args: {
    projectId: v.id("projects"),
    priority: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.projectId, {
      priority: args.priority,
      updatedAt: Date.now(),
    });
  },
});

export const linkTaskToProject = mutation({
  args: {
    projectId: v.id("projects"),
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    
    const taskIds = new Set(project.taskIds);
    taskIds.add(args.taskId);
    
    await ctx.db.patch(args.projectId, {
      taskIds: Array.from(taskIds),
      updatedAt: Date.now(),
    });
  },
});

// Calendar Events
export const listCalendarEvents = query({
  args: {
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let events = await ctx.db.query("calendarEvents").collect();
    events = events.sort((a, b) => a.startTime - b.startTime);
    
    if (args.startTime) {
      events = events.filter(e => e.startTime >= args.startTime!);
    }
    if (args.endTime) {
      events = events.filter(e => e.startTime <= args.endTime!);
    }
    
    return events;
  },
});

export const createCalendarEvent = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    source: v.union(v.literal("google"), v.literal("cron")),
    externalId: v.optional(v.string()),
    recurrence: v.optional(v.string()),
    isTask: v.optional(v.boolean()),
    taskId: v.optional(v.id("tasks")),
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("calendarEvents", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const syncCronJobsToCalendar = mutation({
  args: {
    jobs: v.array(v.object({
      cronId: v.string(),
      name: v.string(),
      scheduleText: v.string(),
      nextRunAt: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let synced = 0;
    
    for (const job of args.jobs) {
      const existing = await ctx.db
        .query("calendarEvents")
        .filter(q => q.eq(q.field("externalId"), job.cronId))
        .first();
      
      if (!existing && job.nextRunAt) {
        await ctx.db.insert("calendarEvents", {
          title: job.name,
          description: job.scheduleText,
          startTime: job.nextRunAt,
          source: "cron",
          externalId: job.cronId,
          recurrence: job.scheduleText,
          createdAt: now,
          updatedAt: now,
        });
        synced++;
      }
    }
    
    return { synced };
  },
});

// Memories
export const listMemories = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let memories = await ctx.db.query("memories").collect();
    memories = memories.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (args.limit) {
      memories = memories.slice(0, args.limit);
    }
    return memories;
  },
});

export const getMemoryByDate = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("memories")
      .filter(q => q.eq(q.field("date"), args.date))
      .first();
  },
});

export const createMemory = mutation({
  args: {
    date: v.string(),
    content: v.string(),
    summary: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("memories", {
      ...args,
      projectIds: [],
      createdAt: now,
    });
  },
});

// Documents
export const listDocuments = query({
  args: {
    projectId: v.optional(v.id("projects")),
    type: v.optional(v.union(v.literal("PRD"), v.literal("Architecture"), v.literal("Newsletter"), v.literal("Report"), v.literal("Other"))),
  },
  handler: async (ctx, args) => {
    let docs = await ctx.db.query("documents").collect();
    docs = docs.sort((a, b) => b.createdAt - a.createdAt);
    
    if (args.projectId) {
      docs = docs.filter(d => d.projectId === args.projectId);
    }
    if (args.type) {
      docs = docs.filter(d => d.type === args.type);
    }
    
    return docs;
  },
});

export const createDocument = mutation({
  args: {
    title: v.string(),
    type: v.union(v.literal("PRD"), v.literal("Architecture"), v.literal("Newsletter"), v.literal("Report"), v.literal("Other")),
    content: v.optional(v.string()),
    googleDriveFileId: v.optional(v.string()),
    googleDriveUrl: v.optional(v.string()),
    projectId: v.optional(v.id("projects")),
    taskId: v.optional(v.id("tasks")),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("documents", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Team / Mission
export const getTeam = query({
  args: {},
  handler: async (ctx) => {
    const team = await ctx.db.query("team").first();
    return team;
  },
});

export const setMissionStatement = mutation({
  args: {
    missionStatement: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("team").first();
    const now = Date.now();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        missionStatement: args.missionStatement,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("team", {
        missionStatement: args.missionStatement,
        updatedAt: now,
      });
    }
  },
});
