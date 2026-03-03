import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Notes:
// - This is an MVP schema focused on persistence + vector-ready fields.
// - Convex vector search is supported via vector indexes (Convex "vectorSearch").
//   We'll store embeddings as number[] and (optionally) add vector indexes later.

export default defineSchema({
  agents: defineTable({
    name: v.string(),
    role: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("idle"),
      v.literal("error"),
      v.literal("paused")
    ),
    lastHeartbeatAt: v.number(), // epoch ms
    taskCount: v.number(),
    currentTask: v.optional(v.string()),
    capabilities: v.optional(v.array(v.string())),
  }).index("by_name", ["name"]),

  tasks: defineTable({
    externalId: v.optional(v.string()), // e.g., ClickUp task id
    title: v.string(),
    description: v.string(),
    status: v.union(
      v.literal("Inbox"),
      v.literal("Assigned"),
      v.literal("In Progress"),
      v.literal("Review"),
      v.literal("Waiting"),
      v.literal("Done")
    ),
    assignedAgentIds: v.array(v.id("agents")),
    tags: v.array(v.string()),
    createdAt: v.number(), // epoch ms
    updatedAt: v.number(),

    // prioritization inputs
    impact: v.number(),
    confidence: v.number(),
    urgency: v.number(),
    effort: v.number(),

    // vector-ready: embed title+description (optional)
    embedding: v.optional(v.array(v.number())),
  })
    .index("by_status", ["status"])
    .index("by_externalId", ["externalId"]),

  deliverables: defineTable({
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
    createdAt: v.number(),
    createdByAgentId: v.optional(v.id("agents")),

    // vector-ready: embed the deliverable text (optional)
    embedding: v.optional(v.array(v.number())),
  }).index("by_task", ["taskId"]),

  events: defineTable({
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
    createdAt: v.number(),
  }).index("by_createdAt", ["createdAt"]),

  chatMessages: defineTable({
    agentName: v.string(),
    message: v.string(),
    createdAt: v.number(),
  }),

  cronJobs: defineTable({
    cronId: v.string(), // openclaw cron id
    name: v.string(),
    scheduleText: v.string(),
    status: v.optional(v.string()),
    lastRunAt: v.optional(v.number()),
    nextRunAt: v.optional(v.number()),
    lastError: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_cronId", ["cronId"]),

  leads: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    source: v.optional(v.string()),
    intent: v.optional(v.string()),
    ts: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_createdAt", ["createdAt"]),

  // Projects - major initiatives from ClickUp
  projects: defineTable({
    externalId: v.optional(v.string()), // ClickUp list/folder id
    name: v.string(),
    description: v.string(),
    status: v.union(v.literal("active"), v.literal("paused"), v.literal("completed")),
    priority: v.number(), // 1-10 scale
    progress: v.number(), // 0-100%
    googleDriveFolderId: v.optional(v.string()),
    googleDriveFolderUrl: v.optional(v.string()),
    taskIds: v.array(v.id("tasks")),
    memoryIds: v.optional(v.array(v.id("memories"))),
    documentIds: v.optional(v.array(v.id("documents"))),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_status", ["status"]).index("by_externalId", ["externalId"]),

  // Calendar events - merged from Google Calendar + OpenClaw cron jobs
  calendarEvents: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    startTime: v.number(), // epoch ms
    endTime: v.optional(v.number()),
    source: v.union(v.literal("google"), v.literal("cron")),
    externalId: v.optional(v.string()), // Google event id or cron job id
    recurrence: v.optional(v.string()), // cron expression or recurrence rule
    isTask: v.optional(v.boolean()), // true if it's a task deadline
    taskId: v.optional(v.id("tasks")),
    projectId: v.optional(v.id("projects")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_startTime", ["startTime"]).index("by_source", ["source"]),

  // Memories - journal-style browsing of OpenClaw memories
  memories: defineTable({
    date: v.string(), // YYYY-MM-DD format
    content: v.string(),
    summary: v.optional(v.string()),
    projectIds: v.optional(v.array(v.id("projects"))),
    tags: v.optional(v.array(v.string())),
    createdAt: v.number(),
  }).index("by_date", ["date"]),

  // Documents - centralized doc repository
  documents: defineTable({
    title: v.string(),
    type: v.union(v.literal("PRD"), v.literal("Architecture"), v.literal("Newsletter"), v.literal("Report"), v.literal("Other")),
    content: v.optional(v.string()),
    googleDriveFileId: v.optional(v.string()),
    googleDriveUrl: v.optional(v.string()),
    projectId: v.optional(v.id("projects")),
    taskId: v.optional(v.id("tasks")),
    tags: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_project", ["projectId"]).index("by_type", ["type"]),

  // Team/Mission - org structure and mission statement
  team: defineTable({
    missionStatement: v.string(),
    updatedAt: v.number(),
  }),
});
