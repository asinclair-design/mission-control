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

type Tab = "dashboard" | "analytics" | "crons" | "errors" | "chat";

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

export default function Home() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [query, setQuery] = useState("");
  const [broadcast, setBroadcast] = useState("");
  const [chatMsg, setChatMsg] = useState("");

  // Queries
  const agents = useQuery(api.agents.list) ?? [];
  const tasks = useQuery(api.tasks.list) ?? [];
  const feed = useQuery(api.events.listRecent, { limit: 40 }) ?? [];
  const cronJobs = useQuery(api.cronJobs.list) ?? [];
  const analytics = useQuery(api.analytics.summary);
  const chatMessages = useQuery(api.chat.list, { limit: 50 }) ?? [];

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

  useEffect(() => {
    void seedIfEmpty({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "dashboard", label: "Dashboard" },
    { key: "analytics", label: "Analytics" },
    { key: "crons", label: "Cron Jobs", count: cronJobs.length },
    { key: "errors", label: "Errors", count: errorEvents.length },
    { key: "chat", label: "Squad Chat" },
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
                              className="rounded-xl border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.03)] p-2"
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
                                  onClick={async () => {
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
                                    onClick={async () => {
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

      <footer className="mt-8 text-sm text-[color:var(--muted)]">
        Backed by Convex (realtime + vector-ready). Dashboard v2.0.
      </footer>
    </main>
  );
}
