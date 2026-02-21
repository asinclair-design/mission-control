import { query } from "./_generated/server";

export const summary = query({
  args: {},
  handler: async (ctx) => {
    const agents = await ctx.db.query("agents").collect();
    const tasks = await ctx.db.query("tasks").collect();
    const events = await ctx.db.query("events").collect();
    const deliverables = await ctx.db.query("deliverables").collect();
    const cronJobs = await ctx.db.query("cronJobs").collect();

    const now = Date.now();

    // Agent metrics
    const activeAgents = agents.filter((a) => a.status === "active").length;
    const idleAgents = agents.filter((a) => a.status === "idle").length;
    const errorAgents = agents.filter((a) => a.status === "error").length;
    const pausedAgents = agents.filter((a) => a.status === "paused").length;

    // Task metrics
    const tasksByStatus: Record<string, number> = {};
    for (const t of tasks) {
      tasksByStatus[t.status] = (tasksByStatus[t.status] ?? 0) + 1;
    }
    const completedTasks = tasksByStatus["Done"] ?? 0;
    const totalTasks = tasks.length;

    // Avg completion time (for Done tasks that have createdAt)
    const doneTasks = tasks.filter((t) => t.status === "Done");
    const avgCompletionMs =
      doneTasks.length > 0
        ? doneTasks.reduce((sum, t) => sum + (t.updatedAt - t.createdAt), 0) /
          doneTasks.length
        : 0;

    // Priority distribution
    const highPriority = tasks.filter(
      (t) => (t.impact * t.confidence * t.urgency) / Math.max(1, t.effort) >= 18
    ).length;
    const medPriority = tasks.filter((t) => {
      const s = (t.impact * t.confidence * t.urgency) / Math.max(1, t.effort);
      return s >= 10 && s < 18;
    }).length;
    const lowPriority = tasks.filter(
      (t) => (t.impact * t.confidence * t.urgency) / Math.max(1, t.effort) < 10
    ).length;

    // Event metrics
    const errors = events.filter((e) => e.type === "error").length;
    const approvalsPending = events.filter(
      (e) => e.type === "approval"
    ).length;

    // Cron metrics
    const cronOk = cronJobs.filter((c) => c.status === "ok").length;
    const cronError = cronJobs.filter((c) => c.status === "error").length;

    // Collaboration frequency (tasks with 2+ agents)
    const collabTasks = tasks.filter(
      (t) => t.assignedAgentIds && t.assignedAgentIds.length >= 2
    ).length;

    return {
      agents: {
        total: agents.length,
        active: activeAgents,
        idle: idleAgents,
        error: errorAgents,
        paused: pausedAgents,
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        byStatus: tasksByStatus,
        avgCompletionMinutes: Math.round(avgCompletionMs / 60000),
        highPriority,
        medPriority,
        lowPriority,
        collaborativeTasks: collabTasks,
      },
      deliverables: {
        total: deliverables.length,
      },
      events: {
        total: events.length,
        errors,
        approvalsPending,
      },
      crons: {
        total: cronJobs.length,
        ok: cronOk,
        error: cronError,
      },
    };
  },
});
