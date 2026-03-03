"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

type TaskStatus =
  | "Inbox"
  | "Assigned"
  | "In Progress"
  | "Review"
  | "Waiting"
  | "Done";

const columns: TaskStatus[] = [
  "Inbox",
  "Assigned",
  "In Progress",
  "Review",
  "Waiting",
  "Done",
];

type Tab = "dashboard" | "projects" | "calendar" | "memories" | "documents" | "team" | "analytics" | "crons" | "errors" | "chat" | "leads";

function scoreColor(score: number) {
  if (score >= 18) return "text-[color:var(--amber)]";
  if (score >= 10) return "text-[color:rgba(51,230,255,0.95)]";
  return "text-[color:rgba(245,246,250,0.7)]";
}

function priorityScore(t: {
  impact: number;
  confidence: number;
  urgency: number;
  effort: number;
}) {
  return (t.impact * t.confidence * t.urgency) / Math.max(1, t.effort);
}

function timeAgo(ms: number) {
  const diff = Math.max(0, Date.now() - ms);
  if (diff < 60_000) return "<1m";
  if (diff < 3600_000) return Math.round(diff / 60_000) + "m";
  if (diff < 86400_000) return Math.round(diff / 3600_000) + "h";
  return Math.round(diff / 86400_000) + "d";
}

function formatDate(ms: number) {
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(ms: number) {
  return new Date(ms).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function TaskDrawer({
  task,
  agents,
  deliverables,
  onClose,
  onAddDeliverable,
  onUpdateStatus,
}: {
  task: any;
  agents: any[];
  deliverables: any[];
  onClose: () => void;
  onAddDeliverable: () => Promise<void>;
  onUpdateStatus: (status: TaskStatus) => Promise<void>;
}) {
  const score = priorityScore(task);
  const assigned = (task.assignedAgentIds ?? [])
    .map((id: string) => agents.find((a) => a._id === id))
    .filter(Boolean);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg h-full overflow-y-auto panel !rounded-none !rounded-l-2xl border-l border-[rgba(255,255,255,0.12)]">
        <div className="panelHeader flex items-center justify-between sticky top-0 z-10 bg-[rgba(10,14,20,0.95)] backdrop-blur-md">
          <div>
            <div className="text-xs text-[color:var(--muted)]">
              {task.externalId ?? task._id}
            </div>
            <div className="font-semibold text-lg">{task.title}</div>
          </div>
          <button
            onClick={onClose}
            className="button !py-2 !px-3"
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-5">
          {/* Status + Score */}
          <div className="flex flex-wrap gap-2 items-center">
            <span
              className={
                "badge " +
                (task.status === "Done"
                  ? "!text-[color:var(--ok)] !border-[rgba(41,214,125,0.35)]"
                  : task.status === "In Progress"
                    ? "!text-[color:var(--cyan)] !border-[rgba(51,230,255,0.35)]"
                    : task.status === "Review"
                      ? "!text-[color:var(--amber)] !border-[rgba(255,176,32,0.35)]"
                      : "")
              }
            >
              {task.status}
            </span>
            <span className={"badge font-semibold " + scoreColor(score)}>
              Score: {score.toFixed(1)}
            </span>
          </div>

          {/* Description */}
          <div>
            <div className="text-xs text-[color:var(--muted)] mb-1 uppercase tracking-wide">
              Description
            </div>
            <div className="text-sm leading-6 text-[color:rgba(245,246,250,0.85)] whitespace-pre-wrap">
              {task.description || "No description."}
            </div>
          </div>

          {/* Priority breakdown */}
          <div>
            <div className="text-xs text-[color:var(--muted)] mb-2 uppercase tracking-wide">
              Priority Breakdown
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Impact", value: task.impact },
                { label: "Confidence", value: task.confidence },
                { label: "Urgency", value: task.urgency },
                { label: "Effort", value: task.effort },
              ].map((m) => (
                <div
                  key={m.label}
                  className="rounded-xl border border-[rgba(255,255,255,0.10)] bg-[rgba(0,0,0,0.18)] p-2 text-center"
                >
                  <div className="text-lg font-semibold">{m.value}</div>
                  <div className="text-[10px] text-[color:var(--muted)]">
                    {m.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          {(task.tags ?? []).length > 0 && (
            <div>
              <div className="text-xs text-[color:var(--muted)] mb-1 uppercase tracking-wide">
                Tags
              </div>
              <div className="flex flex-wrap gap-2">
                {(task.tags ?? []).map((tag: string) => (
                  <span key={tag} className="badge">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Assigned Agents */}
          <div>
            <div className="text-xs text-[color:var(--muted)] mb-1 uppercase tracking-wide">
              Assigned Agents
            </div>
            {assigned.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {assigned.map((a: any) => (
                  <span
                    key={a._id}
                    className={
                      "badge " +
                      (a.status === "active"
                        ? "!text-[color:var(--ok)]"
                        : a.status === "error"
                          ? "!text-[color:var(--danger)]"
                          : "")
                    }
                  >
                    {a.name}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-sm text-[color:var(--muted)]">
                No agents assigned
              </div>
            )}
          </div>

          {/* Deliverables */}
          <div>
            <div className="text-xs text-[color:var(--muted)] mb-1 uppercase tracking-wide">
              Deliverables ({deliverables.length})
            </div>
            {deliverables.length === 0 ? (
              <div className="text-sm text-[color:var(--muted)]">
                No deliverables yet. Task cannot be marked Done without one.
              </div>
            ) : (
              <div className="space-y-2">
                {deliverables.map((d: any) => (
                  <div
                    key={d._id}
                    className="rounded-xl border border-[rgba(255,255,255,0.10)] bg-[rgba(0,0,0,0.14)] p-2 flex items-center justify-between"
                  >
                    <div>
                      <span className="badge !text-[color:var(--ok)]">
                        {d.kind}
                      </span>
                      <span className="ml-2 text-sm">{d.title}</span>
                    </div>
                    {d.href && (
                      <a
                        href={d.href}
                        target="_blank"
                        rel="noreferrer"
                        className="link text-sm"
                      >
                        Open ↗
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Timestamps */}
          <div>
            <div className="text-xs text-[color:var(--muted)] mb-1 uppercase tracking-wide">
              Timestamps
            </div>
            <div className="text-sm text-[color:var(--muted)] space-y-1">
              <div>Created: {new Date(task.createdAt).toLocaleString()}</div>
              <div>Updated: {new Date(task.updatedAt).toLocaleString()}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-[rgba(255,255,255,0.08)] pt-4">
            <div className="text-xs text-[color:var(--muted)] mb-2 uppercase tracking-wide">
              Actions
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="button"
                type="button"
                onClick={onAddDeliverable}
              >
                Add Deliverable
              </button>
              {task.status !== "Done" && (
                <>
                  {(["Inbox", "Assigned", "In Progress", "Review", "Waiting", "Done"] as TaskStatus[])
                    .filter((s) => s !== task.status)
                    .map((s) => (
                      <button
                        key={s}
                        className="button"
                        type="button"
                        onClick={() => onUpdateStatus(s)}
                      >
                        → {s}
                      </button>
                    ))}
                </>
              )}
            </div>
          </div>

          {/* External link */}
          {task.externalId && (
            <div className="border-t border-[rgba(255,255,255,0.08)] pt-4">
              <a
                href={`https://app.clickup.com/t/${task.externalId}`}
                target="_blank"
                rel="noreferrer"
                className="link text-sm"
              >
                Open in ClickUp ↗
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [query, setQuery] = useState("");
  const [broadcast, setBroadcast] = useState("");
  const [chatMsg, setChatMsg] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [calendarView, setCalendarView] = useState<"week" | "month">("week");

  // Queries
  const agents = useQuery(api.agents.list) ?? [];
  const tasks = useQuery(api.tasks.list) ?? [];
  const feed = useQuery(api.events.listRecent, { limit: 40 }) ?? [];
  const cronJobs = useQuery(api.cronJobs.list) ?? [];
  const analytics = useQuery(api.analytics.summary);
  const chatMessages = useQuery(api.chat.list, { limit: 50 }) ?? [];
  const leads = useQuery(api.leads.listRecent, { limit: 100 }) ?? [];
  
  // New queries for projects, calendar, memories, documents, team
  const projects = useQuery(api.projects.listProjects) ?? [];
  const calendarEvents = useQuery(api.projects.listCalendarEvents, {}) ?? [];
  const memories = useQuery(api.projects.listMemories, { limit: 50 }) ?? [];
  const documents = useQuery(api.projects.listDocuments, {}) ?? [];
  const team = useQuery(api.projects.getTeam);

  // Mutations
  const seedIfEmpty = useMutation(api.seed.seedIfEmpty);
  const updateStatus = useMutation(api.tasks.updateStatus);
  const createTask = useMutation(api.tasks.create);
  const appendEvent = useMutation(api.events.append);
  const addDeliverable = useMutation(api.deliverables.create);
  const setAgentStatus = useMutation(api.agents.setStatus);
  const removeAgent = useMutation(api.agents.remove);
  const createAgent = useMutation(api.agents.create);
  const sendChat = useMutation(api.chat.send);
  
  // New mutations for projects
  const updateProjectStatus = useMutation(api.projects.updateProjectStatus);
  const createProject = useMutation(api.projects.createProject);

  useEffect(() => {
    void seedIfEmpty({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedTask = useMemo(
    () => tasks.find((t) => t._id === selectedTaskId),
    [tasks, selectedTaskId]
  );
  const selectedDeliverables = useQuery(
    api.deliverables.listByTask,
    selectedTaskId ? { taskId: selectedTaskId as Id<"tasks"> } : "skip"
  ) ?? [];

  const filteredTasks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter((t) => {
      const tags = (t.tags ?? []).join(" ").toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        tags.includes(q)
      );
    });
  }, [query, tasks]);

  const errorEvents = useMemo(
    () => feed.filter((e) => e.type === "error" || e.priority === "high"),
    [feed]
  );

  // Separate active and paused projects
  const activeProjects = useMemo(() => 
    projects.filter((p) => p.status !== "paused"),
    [projects]
  );
  
  const pausedProjects = useMemo(() => 
    projects.filter((p) => p.status === "paused"),
    [projects]
  );

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "dashboard", label: "Dashboard" },
    { key: "projects", label: "Projects", count: projects.length },
    { key: "calendar", label: "Calendar", count: calendarEvents.length },
    { key: "memories", label: "Memories", count: memories.length },
    { key: "documents", label: "Documents", count: documents.length },
    { key: "team", label: "Team" },
    { key: "analytics", label: "Analytics" },
    { key: "crons", label: "Cron Jobs", count: cronJobs.length },
    { key: "errors", label: "Errors", count: errorEvents.length },
    { key: "chat", label: "Squad Chat" },
    { key: "leads", label: "Leads", count: leads.length },
  ];

  return (
    <main className="min-h-screen px-6 py-6">
      {/* Header */}
      <header className="mb-6 flex items-start justify-between gap-6">
        <div className="max-w-[68ch]">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="badge">OpenClaw</span>
            <span className="badge">Multi-agent orchestration</span>
            <span className="badge">Convex</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Mission Control
          </h1>
          <p className="mt-2 text-[color:var(--muted)] leading-6">
            Centralized command, monitoring, delegation, and deliverable gating
            for multiple autonomous agents.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/docs" className="button">
            Specs
            <span className="kbd">/docs</span>
          </Link>
          <a
            href="https://github.com/asinclair-design/mission-control"
            className="button"
            target="_blank"
            rel="noreferrer"
          >
            Repo
          </a>
        </div>
      </header>

      {/* Tab bar */}
      <nav className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={
              "badge cursor-pointer " +
              (tab === t.key
                ? "!text-[color:var(--amber)] !border-[rgba(255,176,32,0.35)]"
                : "")
            }
          >
            {t.label}
            {t.count !== undefined && t.count > 0 ? ` (${t.count})` : ""}
          </button>
        ))}
      </nav>

      {/* ═════════════════════════════ DASHBOARD TAB ═════════════════════════════ */}
      {tab === "dashboard" && (
        <div className="grid grid-cols-12 gap-4">
          {/* Left: Agent Registry */}
          <section className="col-span-12 lg:col-span-3 panel overflow-hidden">
            <div className="panelHeader flex items-center justify-between">
              <div>
                <div className="text-sm text-[color:var(--muted)]">
                  Registry
                </div>
                <div className="font-semibold">Agents ({agents.length})</div>
              </div>
              <div className="flex gap-2">
                <button
                  className="button !py-2 !px-3"
                  type="button"
                  onClick={async () => {
                    const name = prompt("Agent name:");
                    if (!name) return;
                    const role = prompt("Agent role:") || "General";
                    await createAgent({ name, role });
                    await appendEvent({
                      type: "task",
                      title: "Agent spawned",
                      detail: `Spawned agent: ${name} (${role})`,
                      priority: "med",
                    });
                  }}
                >
                  Spawn
                </button>
                <button
                  className="button !py-2 !px-3"
                  type="button"
                  onClick={async () => {
                    const title = prompt("New task title:");
                    if (!title) return;
                    const { id } = await createTask({ title, tags: ["manual"] });
                    await appendEvent({
                      type: "task",
                      title: "Task created",
                      detail: `Created: ${title}`,
                      priority: "low",
                      taskId: id,
                    });
                  }}
                >
                  + Task
                </button>
              </div>
            </div>
            <div className="panelBody space-y-3 max-h-[65vh] overflow-y-auto">
              {agents.map((a) => (
                <div
                  key={a._id}
                  className="rounded-2xl border border-[rgba(255,255,255,0.10)] bg-[rgba(0,0,0,0.18)] p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold">{a.name}</div>
                      <div className="text-sm text-[color:var(--muted)]">
                        {a.role}
                      </div>
                    </div>
                    <span
                      className={
                        "badge " +
                        (a.status === "active"
                          ? "!text-[color:var(--ok)]"
                          : a.status === "error"
                            ? "!text-[color:var(--danger)]"
                            : a.status === "paused"
                              ? "!text-[color:var(--amber)]"
                              : "")
                      }
                    >
                      {a.status}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="badge">hb {timeAgo(a.lastHeartbeatAt)}</span>
                    <span className="badge">tasks {a.taskCount}</span>
                    {a.currentTask ? (
                      <span className="badge">now: {a.currentTask}</span>
                    ) : null}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {a.status !== "paused" ? (
                      <button
                        className="button !py-2 !px-3"
                        type="button"
                        onClick={async () => {
                          await setAgentStatus({
                            agentId: a._id as Id<"agents">,
                            status: "paused",
                          });
                          await appendEvent({
                            type: "message",
                            title: "Agent paused",
                            detail: `${a.name} paused`,
                            priority: "med",
                            agentId: a._id as Id<"agents">,
                          });
                        }}
                      >
                        Pause
                      </button>
                    ) : (
                      <button
                        className="button !py-2 !px-3"
                        type="button"
                        onClick={async () => {
                          await setAgentStatus({
                            agentId: a._id as Id<"agents">,
                            status: "active",
                          });
                          await appendEvent({
                            type: "message",
                            title: "Agent restarted",
                            detail: `${a.name} restarted`,
                            priority: "med",
                            agentId: a._id as Id<"agents">,
                          });
                        }}
                      >
                        Restart
                      </button>
                    )}
                    <button
                      className="button !py-2 !px-3"
                      type="button"
                      onClick={async () => {
                        if (!confirm(`Delete agent ${a.name}?`)) return;
                        await removeAgent({ agentId: a._id as Id<"agents"> });
                        await appendEvent({
                          type: "message",
                          title: "Agent deleted",
                          detail: `Deleted agent: ${a.name}`,
                          priority: "med",
                        });
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Center: Kanban */}
          <section className="col-span-12 lg:col-span-6 panel overflow-hidden">
            <div className="panelHeader flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm text-[color:var(--muted)]">
                  Mission Queue
                </div>
                <div className="font-semibold">Kanban ({tasks.length})</div>
              </div>
              <div className="flex items-center gap-2 w-full lg:w-[360px]">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="input"
                  placeholder="Filter tasks by title/tag…"
                />
              </div>
            </div>

            <div className="panelBody">
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                {columns.map((col) => (
                  <div
                    key={col}
                    className="rounded-2xl border border-[rgba(255,255,255,0.10)] bg-[rgba(0,0,0,0.14)] overflow-hidden"
                  >
                    <div className="px-3 py-2 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
                      <div className="font-semibold text-xs">{col}</div>
                      <span className="badge">
                        {filteredTasks.filter((t) => t.status === col).length}
                      </span>
                    </div>
                    <div className="p-2 space-y-2 min-h-[100px] max-h-[55vh] overflow-y-auto">
                      {filteredTasks
                        .filter((t) => t.status === col)
                        .sort((a, b) => priorityScore(b) - priorityScore(a))
                        .map((t) => {
                          const score = priorityScore(t);
                          return (
                            <div
                              key={t._id}
                              className="rounded-xl border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.03)] p-2 cursor-pointer hover:border-[rgba(255,176,32,0.3)] transition-colors"
                              onClick={() => setSelectedTaskId(t._id)}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <div className="min-w-0">
                                  <div className="text-[10px] text-[color:rgba(245,246,250,0.45)]">
                                    {t.externalId ?? t._id.slice(-6)}
                                  </div>
                                  <div className="font-semibold text-xs leading-4 truncate">
                                    {t.title}
                                  </div>
                                </div>
                                <div
                                  className={
                                    "text-xs font-semibold shrink-0 " +
                                    scoreColor(score)
                                  }
                                >
                                  {score.toFixed(0)}
                                </div>
                              </div>

                              <div className="mt-1 flex flex-wrap gap-1">
                                {(t.tags ?? []).slice(0, 3).map((tag) => (
                                  <span
                                    key={tag}
                                    className="badge !text-[10px] !py-0 !px-1"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>

                              <div className="mt-2 flex flex-wrap gap-1">
                                <button
                                  className="button !py-1 !px-2 !text-[10px]"
                                  type="button"
                                  onClick={async (e) => { e.stopPropagation();
                                    await addDeliverable({
                                      taskId: t._id,
                                      kind: "Markdown",
                                      title: "Deliverable",
                                    });
                                    await appendEvent({
                                      type: "deliverable",
                                      title: "Deliverable added",
                                      detail: t.title,
                                      priority: "low",
                                      taskId: t._id,
                                    });
                                  }}
                                >
                                  +Deliv
                                </button>
                                {t.status !== "Done" && (
                                  <button
                                    className="button !py-1 !px-2 !text-[10px]"
                                    type="button"
                                    onClick={async (e) => { e.stopPropagation();
                                      try {
                                        await updateStatus({
                                          taskId: t._id,
                                          status: "Done",
                                        });
                                        await appendEvent({
                                          type: "task",
                                          title: "Task done",
                                          detail: t.title,
                                          priority: "med",
                                          taskId: t._id,
                                        });
                                      } catch (err: unknown) {
                                        alert(
                                          err instanceof Error
                                            ? err.message
                                            : String(err)
                                        );
                                      }
                                    }}
                                  >
                                    Done
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 text-xs text-[color:var(--muted)]">
                Rule: tasks can't be marked Done without a deliverable.
                Score = impact × confidence × urgency ÷ effort.
              </div>
            </div>
          </section>

          {/* Right: Live Feed */}
          <section className="col-span-12 lg:col-span-3 panel overflow-hidden">
            <div className="panelHeader">
              <div className="text-sm text-[color:var(--muted)]">Realtime</div>
              <div className="font-semibold">Live Feed ({feed.length})</div>
            </div>
            <div className="panelBody space-y-3 max-h-[65vh] overflow-y-auto">
              {feed.map((e) => (
                <div
                  key={e._id}
                  className="rounded-2xl border border-[rgba(255,255,255,0.10)] bg-[rgba(0,0,0,0.16)] p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">{e.title}</div>
                    <span
                      className={
                        "badge " +
                        (e.priority === "high"
                          ? "!text-[color:var(--danger)]"
                          : e.priority === "med"
                            ? "!text-[color:var(--amber)]"
                            : "")
                      }
                    >
                      {e.type}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-[color:rgba(245,246,250,0.70)]">
                    {e.detail}
                  </div>
                  <div className="mt-2">
                    <span className="badge">{timeAgo(e.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Broadcast */}
          <section className="col-span-12 panel overflow-hidden">
            <div className="panelHeader flex items-center justify-between gap-4">
              <div>
                <div className="text-sm text-[color:var(--muted)]">Command</div>
                <div className="font-semibold">Broadcast Console</div>
              </div>
              <div className="flex gap-2 text-sm text-[color:var(--muted)]">
                <span className="badge">All agents</span>
                <span className="badge">Targeted</span>
                <span className="badge">Scheduled</span>
              </div>
            </div>
            <div className="panelBody">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
                <div className="lg:col-span-9">
                  <textarea
                    value={broadcast}
                    onChange={(e) => setBroadcast(e.target.value)}
                    className="input min-h-[80px]"
                    placeholder='e.g. "Find podcasts I can appear on" — agents will fan out, create subtasks, and produce deliverables.'
                  />
                </div>
                <div className="lg:col-span-3 flex flex-col gap-2">
                  <button
                    className="button justify-center"
                    type="button"
                    onClick={async () => {
                      const msg = broadcast.trim();
                      if (!msg) return;
                      const { id } = await createTask({
                        title: msg,
                        tags: ["broadcast"],
                      });
                      await appendEvent({
                        type: "message",
                        title: "Broadcast sent",
                        detail: msg,
                        priority: "med",
                        taskId: id,
                      });
                      setBroadcast("");
                    }}
                    disabled={!broadcast.trim()}
                  >
                    Broadcast to all
                  </button>
                  <button className="button justify-center" type="button" disabled>
                    Schedule
                  </button>
                  <button className="button justify-center" type="button" disabled>
                    Attach files
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ═════════════════════════════ PROJECTS TAB ═════════════════════════════ */}
      {tab === "projects" && (
        <div className="space-y-6">
          {/* Active Projects */}
          <div className="panel overflow-hidden">
            <div className="panelHeader flex items-center justify-between">
              <div>
                <div className="text-sm text-[color:var(--muted)]">Active</div>
                <div className="font-semibold">Active Projects ({activeProjects.length})</div>
              </div>
              <button
                className="button !py-2 !px-3"
                type="button"
                onClick={async () => {
                  const name = prompt("Project name:");
                  if (!name) return;
                  const description = prompt("Description:") || "";
                  await createProject({ name, description });
                }}
              >
                + Project
              </button>
            </div>
            <div className="panelBody">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeProjects.map((p) => (
                  <div
                    key={p._id}
                    className="rounded-2xl border border-[rgba(255,255,255,0.10)] bg-[rgba(0,0,0,0.18)] p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{p.name}</div>
                        <div className="text-sm text-[color:var(--muted)] line-clamp-2">
                          {p.description || "No description"}
                        </div>
                      </div>
                      <span
                        className={
                          "badge shrink-0 " +
                          (p.priority >= 8
                            ? "!text-[color:var(--danger)]"
                            : p.priority >= 5
                              ? "!text-[color:var(--amber)]"
                              : "")
                        }
                      >
                        Priority {p.priority}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-[color:var(--muted)] mb-1">
                        <span>Progress</span>
                        <span>{p.progress}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[rgba(255,255,255,0.1)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[color:var(--cyan)]"
                          style={{ width: `${p.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="badge">{p.status}</span>
                      {p.googleDriveFolderUrl && (
                        <a
                          href={p.googleDriveFolderUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="badge !text-[color:var(--cyan)]"
                        >
                          Drive ↗
                        </a>
                      )}
                    </div>

                    <div className="mt-3 flex gap-2">
                      <button
                        className="button !py-1 !px-2 !text-xs"
                        type="button"
                        onClick={async () => {
                          await updateProjectStatus({
                            projectId: p._id,
                            status: "paused",
                          });
                        }}
                      >
                        Pause
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {activeProjects.length === 0 && (
                <div className="text-sm text-[color:var(--muted)]">
                  No active projects. Create one to get started.
                </div>
              )}
            </div>
          </div>

          {/* Paused Projects */}
          {pausedProjects.length > 0 && (
            <div className="panel overflow-hidden">
              <div className="panelHeader">
                <div>
                  <div className="text-sm text-[color:var(--muted)]">Paused</div>
                  <div className="font-semibold">Paused Projects ({pausedProjects.length})</div>
                </div>
              </div>
              <div className="panelBody">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pausedProjects.map((p) => (
                    <div
                      key={p._id}
                      className="rounded-2xl border border-[rgba(255,255,255,0.10)] bg-[rgba(0,0,0,0.18)] p-4 opacity-70"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{p.name}</div>
                          <div className="text-sm text-[color:var(--muted)] line-clamp-2">
                            {p.description || "No description"}
                          </div>
                        </div>
                        <span className="badge !text-[color:var(--amber)]">
                          paused
                        </span>
                      </div>

                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-[color:var(--muted)] mb-1">
                          <span>Progress</span>
                          <span>{p.progress}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[rgba(255,255,255,0.1)] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[color:var(--amber)]"
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-3 flex gap-2">
                        <button
                          className="button !py-1 !px-2 !text-xs"
                          type="button"
                          onClick={async () => {
                            await updateProjectStatus({
                              projectId: p._id,
                              status: "active",
                            });
                          }}
                        >
                          Resume
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═════════════════════════════ CALENDAR TAB ═════════════════════════════ */}
      {tab === "calendar" && (
        <div className="panel overflow-hidden">
          <div className="panelHeader flex items-center justify-between">
            <div>
              <div className="text-sm text-[color:var(--muted)]">Events</div>
              <div className="font-semibold">Calendar ({calendarEvents.length})</div>
            </div>
            <div className="flex gap-2">
              <button
                className={`button !py-2 !px-3 ${calendarView === "week" ? "!text-[color:var(--amber)]" : ""}`}
                type="button"
                onClick={() => setCalendarView("week")}
              >
                Week
              </button>
              <button
                className={`button !py-2 !px-3 ${calendarView === "month" ? "!text-[color:var(--amber)]" : ""}`}
                type="button"
                onClick={() => setCalendarView("month")}
              >
                Month
              </button>
            </div>
          </div>
          <div className="panelBody">
            <div className="space-y-3">
              {calendarEvents
                .sort((a, b) => b.startTime - a.startTime)
                .map((e) => (
                <div
                  key={e._id}
                  className="rounded-2xl border border-[rgba(255,255,255,0.10)] bg-[rgba(0,0,0,0.14)] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold">{e.title}</div>
                      {e.description && (
                        <div className="text-sm text-[color:var(--muted)] mt-1">
                          {e.description}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-medium">
                        {formatDateTime(e.startTime)}
                      </div>
                      <div className="text-xs text-[color:var(--muted)]">
                        {e.endTime ? formatDateTime(e.endTime) : "No end time"}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span
                      className={
                        "badge " +
                        (e.source === "google"
                          ? "!text-[color:var(--cyan)]"
                          : "!text-[color:var(--amber)]")
                      }
                    >
                      {e.source}
                    </span>
                    {e.externalId && (
                      <span className="badge text-[10px]">
                        ID: {e.externalId}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {calendarEvents.length === 0 && (
              <div className="text-sm text-[color:var(--muted)]">
                No calendar events. Events will appear here when synced from Google Calendar or Cron.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═════════════════════════════ MEMORIES TAB ═════════════════════════════ */}
      {tab === "memories" && (
        <div className="panel overflow-hidden">
          <div className="panelHeader">
            <div>
              <div className="text-sm text-[color:var(--muted)]">Journal</div>
              <div className="font-semibold">Memories ({memories.length})</div>
            </div>
          </div>
          <div className="panelBody">
            <div className="space-y-4">
              {memories
                .sort((a, b) => b.createdAt - a.createdAt)
                .map((m) => (
                <div
                  key={m._id}
                  className="rounded-2xl border border-[rgba(255,255,255,0.10)] bg-[rgba(0,0,0,0.14)] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-[color:var(--muted)] mb-1">
                        {formatDate(m.createdAt)}
                      </div>
                      <div className="text-[color:rgba(245,246,250,0.9)] leading-relaxed">
                        {m.content}
                      </div>
                    </div>
                  </div>
                  {(m.tags ?? []).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(m.tags ?? []).map((tag: string) => (
                        <span key={tag} className="badge !text-[10px]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {memories.length === 0 && (
              <div className="text-sm text-[color:var(--muted)]">
                No memories recorded yet. Memories capture important context and decisions.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═════════════════════════════ DOCUMENTS TAB ═════════════════════════════ */}
      {tab === "documents" && (
        <div className="panel overflow-hidden">
          <div className="panelHeader">
            <div>
              <div className="text-sm text-[color:var(--muted)]">Files</div>
              <div className="font-semibold">Documents ({documents.length})</div>
            </div>
          </div>
          <div className="panelBody">
            <div className="space-y-3">
              {documents.map((d) => (
                <div
                  key={d._id}
                  className="rounded-2xl border border-[rgba(255,255,255,0.10)] bg-[rgba(0,0,0,0.14)] p-4 flex items-center justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate">{d.title}</div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <span
                        className={
                          "badge !text-[10px] " +
                          (d.type === "PRD"
                            ? "!text-[color:var(--cyan)]"
                            : d.type === "Architecture"
                              ? "!text-[color:var(--amber)]"
                              : d.type === "Newsletter"
                                ? "!text-[color:var(--ok)]"
                                : "")
                        }
                      >
                        {d.type}
                      </span>
                      {d.projectId && (
                        <span className="badge !text-[10px] text-[color:var(--muted)]">
                          Linked to project
                        </span>
                      )}
                    </div>
                  </div>
                  {d.googleDriveUrl && (
                    <a
                      href={d.googleDriveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="button !py-2 !px-3 shrink-0 ml-4"
                    >
                      Open ↗
                    </a>
                  )}
                </div>
              ))}
            </div>
            {documents.length === 0 && (
              <div className="text-sm text-[color:var(--muted)]">
                No documents yet. Documents are linked from Google Drive.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═════════════════════════════ TEAM TAB ═════════════════════════════ */}
      {tab === "team" && (
        <div className="space-y-6">
          {/* Mission Statement */}
          {team?.missionStatement && (
            <div className="panel overflow-hidden">
              <div className="panelHeader">
                <div>
                  <div className="text-sm text-[color:var(--muted)]">Mission</div>
                  <div className="font-semibold">Our Mission</div>
                </div>
              </div>
              <div className="panelBody">
                <p className="text-[color:rgba(245,246,250,0.9)] leading-relaxed text-lg">
                  {team.missionStatement}
                </p>
              </div>
            </div>
          )}

          {/* Agent Org Chart */}
          <div className="panel overflow-hidden">
            <div className="panelHeader">
              <div>
                <div className="text-sm text-[color:var(--muted)]">Organization</div>
                <div className="font-semibold">Agent Org Chart ({agents.length})</div>
              </div>
            </div>
            <div className="panelBody">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.map((a) => (
                  <div
                    key={a._id}
                    className="rounded-2xl border border-[rgba(255,255,255,0.10)] bg-[rgba(0,0,0,0.18)] p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold">{a.name}</div>
                        <div className="text-sm text-[color:var(--muted)]">
                          {a.role}
                        </div>
                      </div>
                      <span
                        className={
                          "badge " +
                          (a.status === "active"
                            ? "!text-[color:var(--ok)]"
                            : a.status === "error"
                              ? "!text-[color:var(--danger)]"
                              : a.status === "paused"
                                ? "!text-[color:var(--amber)]"
                                : "")
                        }
                      >
                        {a.status}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="badge text-[10px]">
                        {a.taskCount} tasks
                      </span>
                      <span className="badge text-[10px]">
                        hb {timeAgo(a.lastHeartbeatAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════ ANALYTICS TAB ═════════════════════════════ */}
      {tab === "analytics" && analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Agents", value: analytics.agents.total, sub: `${analytics.agents.active} active · ${analytics.agents.error} error` },
            { label: "Tasks", value: analytics.tasks.total, sub: `${analytics.tasks.completed} done · ${analytics.tasks.total - analytics.tasks.completed} open` },
            { label: "Deliverables", value: analytics.deliverables.total, sub: "total submitted" },
            { label: "Events", value: analytics.events.total, sub: `${analytics.events.errors} errors · ${analytics.events.approvalsPending} approvals` },
            { label: "Cron Jobs", value: analytics.crons.total, sub: `${analytics.crons.ok} ok · ${analytics.crons.error} error` },
            { label: "High Priority", value: analytics.tasks.highPriority, sub: "score ≥ 18" },
            { label: "Med Priority", value: analytics.tasks.medPriority, sub: "score 10–17" },
            { label: "Collaborative", value: analytics.tasks.collaborativeTasks, sub: "2+ agents assigned" },
          ].map((m) => (
            <div key={m.label} className="panel p-4">
              <div className="text-sm text-[color:var(--muted)]">{m.label}</div>
              <div className="text-3xl font-semibold mt-1">{m.value}</div>
              <div className="text-xs text-[color:var(--muted)] mt-1">{m.sub}</div>
            </div>
          ))}

          {/* Task status breakdown */}
          <div className="col-span-2 md:col-span-4 panel overflow-hidden">
            <div className="panelHeader">
              <div className="font-semibold">Task Status Breakdown</div>
            </div>
            <div className="panelBody">
              <div className="flex flex-wrap gap-4">
                {Object.entries(analytics.tasks.byStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        background:
                          status === "Done"
                            ? "var(--ok)"
                            : status === "In Progress"
                              ? "var(--cyan)"
                              : status === "Review"
                                ? "var(--amber)"
                                : "rgba(255,255,255,0.3)",
                      }}
                    />
                    <span className="text-sm">
                      {status}: <strong>{count as number}</strong>
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 w-full h-6 rounded-full overflow-hidden flex bg-[rgba(0,0,0,0.3)]">
                {Object.entries(analytics.tasks.byStatus).map(([status, count]) => (
                  <div
                    key={status}
                    className="h-full"
                    style={{
                      width: `${((count as number) / Math.max(1, analytics.tasks.total)) * 100}%`,
                      background:
                        status === "Done"
                          ? "var(--ok)"
                          : status === "In Progress"
                            ? "var(--cyan)"
                            : status === "Review"
                              ? "var(--amber)"
                              : "rgba(255,255,255,0.15)",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════ CRON JOBS TAB ═════════════════════════════ */}
      {tab === "crons" && (
        <div className="panel overflow-hidden">
          <div className="panelHeader">
            <div className="font-semibold">
              OpenClaw Cron Jobs ({cronJobs.length})
            </div>
          </div>
          <div className="panelBody">
            <div className="space-y-3">
              {cronJobs.map((j) => (
                <div
                  key={j._id}
                  className="rounded-2xl border border-[rgba(255,255,255,0.10)] bg-[rgba(0,0,0,0.14)] p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold">{j.name}</div>
                      <div className="text-sm text-[color:var(--muted)]">
                        {j.scheduleText}
                      </div>
                    </div>
                    <span
                      className={
                        "badge " +
                        (j.status === "ok"
                          ? "!text-[color:var(--ok)]"
                          : j.status === "error"
                            ? "!text-[color:var(--danger)]"
                            : "")
                      }
                    >
                      {j.status ?? "unknown"}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {j.lastRunAt ? (
                      <span className="badge">
                        last: {timeAgo(j.lastRunAt)}
                      </span>
                    ) : null}
                    {j.nextRunAt ? (
                      <span className="badge">
                        next: {new Date(j.nextRunAt).toLocaleTimeString()}
                      </span>
                    ) : null}
                  </div>

                  {j.lastError ? (
                    <div className="mt-2 text-sm text-[color:var(--danger)] bg-[rgba(255,77,77,0.08)] rounded-xl p-2">
                      {j.lastError}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════ ERRORS TAB ═════════════════════════════ */}
      {tab === "errors" && (
        <div className="panel overflow-hidden">
          <div className="panelHeader">
            <div className="font-semibold">
              Errors & Critical Events ({errorEvents.length})
            </div>
          </div>
          <div className="panelBody space-y-3">
            {errorEvents.length === 0 && (
              <div className="text-[color:var(--muted)] text-sm">
                No errors or critical events. 🎉
              </div>
            )}
            {errorEvents.map((e) => (
              <div
                key={e._id}
                className="rounded-2xl border border-[rgba(255,77,77,0.25)] bg-[rgba(255,77,77,0.06)] p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-sm">{e.title}</div>
                  <span className="badge !text-[color:var(--danger)]">
                    {e.type} · {e.priority}
                  </span>
                </div>
                <div className="mt-1 text-sm text-[color:rgba(245,246,250,0.70)]">
                  {e.detail}
                </div>
                <div className="mt-2">
                  <span className="badge">{timeAgo(e.createdAt)}</span>
                </div>
              </div>
            ))}

            {/* Cron errors */}
            {cronJobs.filter((c) => c.lastError).length > 0 && (
              <>
                <div className="mt-4 font-semibold text-sm border-t border-[rgba(255,255,255,0.08)] pt-3">
                  Cron Job Errors
                </div>
                {cronJobs
                  .filter((c) => c.lastError)
                  .map((c) => (
                    <div
                      key={c._id}
                      className="rounded-2xl border border-[rgba(255,77,77,0.25)] bg-[rgba(255,77,77,0.06)] p-3"
                    >
                      <div className="font-semibold text-sm">{c.name}</div>
                      <div className="mt-1 text-sm text-[color:var(--danger)]">
                        {c.lastError}
                      </div>
                      <div className="mt-2">
                        <span className="badge">{c.scheduleText}</span>
                      </div>
                    </div>
                  ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* ═════════════════════════════ SQUAD CHAT TAB ═════════════════════════════ */}
      {tab === "chat" && (
        <div className="panel overflow-hidden">
          <div className="panelHeader">
            <div className="text-sm text-[color:var(--muted)]">
              Agent-to-agent + operator
            </div>
            <div className="font-semibold">Squad Chat</div>
          </div>
          <div className="panelBody">
            <div className="space-y-3 max-h-[50vh] overflow-y-auto mb-4">
              {chatMessages.length === 0 && (
                <div className="text-[color:var(--muted)] text-sm">
                  No messages yet. Agents can share discoveries and collaborate
                  here.
                </div>
              )}
              {chatMessages.map((m) => (
                <div
                  key={m._id}
                  className="rounded-2xl border border-[rgba(255,255,255,0.10)] bg-[rgba(0,0,0,0.14)] p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{m.agentName}</span>
                    <span className="badge">{timeAgo(m.createdAt)}</span>
                  </div>
                  <div className="mt-1 text-sm text-[color:rgba(245,246,250,0.82)]">
                    {m.message}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={chatMsg}
                onChange={(e) => setChatMsg(e.target.value)}
                className="input"
                placeholder="Send as operator…"
                onKeyDown={async (e) => {
                  if (e.key === "Enter" && chatMsg.trim()) {
                    await sendChat({
                      agentName: "Operator",
                      message: chatMsg.trim(),
                    });
                    setChatMsg("");
                  }
                }}
              />
              <button
                className="button"
                type="button"
                disabled={!chatMsg.trim()}
                onClick={async () => {
                  if (!chatMsg.trim()) return;
                  await sendChat({
                    agentName: "Operator",
                    message: chatMsg.trim(),
                  });
                  setChatMsg("");
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════ LEADS TAB ═════════════════════════════ */}
      {tab === "leads" && (
        <div className="panel overflow-hidden">
          <div className="panelHeader flex items-center justify-between gap-4">
            <div>
              <div className="text-sm text-[color:var(--muted)]">
                Captured from lead magnets
              </div>
              <div className="font-semibold">Leads ({leads.length})</div>
            </div>
            <div className="text-xs text-[color:var(--muted)]">
              Source: mould-texture-gallery
            </div>
          </div>

          <div className="panelBody">
            {leads.length === 0 ? (
              <div className="text-sm text-[color:var(--muted)]">
                No leads captured yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[color:var(--muted)]">
                      <th className="py-2 pr-3">Email</th>
                      <th className="py-2 pr-3">Name</th>
                      <th className="py-2 pr-3">Intent</th>
                      <th className="py-2 pr-3">Source</th>
                      <th className="py-2 pr-3">Captured</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((l) => (
                      <tr
                        key={l._id}
                        className="border-t border-[rgba(255,255,255,0.08)]"
                      >
                        <td className="py-2 pr-3 font-medium text-[color:rgba(245,246,250,0.92)]">
                          {l.email}
                        </td>
                        <td className="py-2 pr-3 text-[color:rgba(245,246,250,0.82)]">
                          {l.name ?? "—"}
                        </td>
                        <td className="py-2 pr-3">
                          <span className="badge">{l.intent ?? "—"}</span>
                        </td>
                        <td className="py-2 pr-3 text-[color:var(--muted)]">
                          {l.source ?? "—"}
                        </td>
                        <td className="py-2 pr-3 text-[color:var(--muted)]">
                          {timeAgo(l.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 rounded-2xl border border-[rgba(255,255,255,0.10)] bg-[rgba(0,0,0,0.14)] p-3 text-xs text-[color:var(--muted)]">
              Tip: If you want true email marketing flows (double opt-in,
              sequences), we can export/sync these to Brevo/Mailchimp later —
              Convex remains the system-of-record.
            </div>
          </div>
        </div>
      )}

      <footer className="mt-8 text-sm text-[color:var(--muted)]">
        Backed by Convex (realtime + vector-ready). Dashboard v2.0.
      </footer>

      {/* Task Detail Drawer */}
      {selectedTask && (
        <TaskDrawer
          task={selectedTask}
          agents={agents}
          deliverables={selectedDeliverables}
          onClose={() => setSelectedTaskId(null)}
          onAddDeliverable={async () => {
            const title = prompt("Deliverable title:") || "Deliverable";
            await addDeliverable({
              taskId: selectedTask._id as Id<"tasks">,
              kind: "Markdown",
              title,
            });
            await appendEvent({
              type: "deliverable",
              title: "Deliverable added",
              detail: `${title} → ${selectedTask.title}`,
              priority: "low",
              taskId: selectedTask._id as Id<"tasks">,
            });
          }}
          onUpdateStatus={async (status: TaskStatus) => {
            try {
              await updateStatus({
                taskId: selectedTask._id as Id<"tasks">,
                status,
              });
              await appendEvent({
                type: "task",
                title: `Task → ${status}`,
                detail: selectedTask.title,
                priority: "med",
                taskId: selectedTask._id as Id<"tasks">,
              });
            } catch (err: unknown) {
              alert(err instanceof Error ? err.message : String(err));
            }
          }}
        />
      )}
    </main>
  );
}
// Cache bust 1772519810
