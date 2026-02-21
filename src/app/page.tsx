"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

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

export default function Home() {
  const [query, setQuery] = useState("");
  const [broadcast, setBroadcast] = useState("");

  // Queries (realtime)
  const agents = useQuery(api.agents.list) ?? [];
  const tasks = useQuery(api.tasks.list) ?? [];
  const feed = useQuery(api.events.listRecent, { limit: 40 }) ?? [];

  // Mutations
  const seedIfEmpty = useMutation(api.seed.seedIfEmpty);
  const updateStatus = useMutation(api.tasks.updateStatus);
  const createTask = useMutation(api.tasks.create);
  const appendEvent = useMutation(api.events.append);
  const addDeliverable = useMutation(api.deliverables.create);

  // Ensure the app isn't blank on a new DB.
  // This is safe: the mutation no-ops if agents exist.
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

  return (
    <main className="min-h-screen px-6 py-6">
      <header className="mb-6 flex items-start justify-between gap-6">
        <div className="max-w-[68ch]">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="badge">OpenClaw</span>
            <span className="badge">Multi-agent orchestration</span>
            <span className="badge">Convex persistence</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Mission Control</h1>
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
            <span className="kbd">gh</span>
          </a>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-4">
        {/* Left: Agent Registry */}
        <section className="col-span-12 lg:col-span-3 panel overflow-hidden">
          <div className="panelHeader flex items-center justify-between">
            <div>
              <div className="text-sm text-[color:var(--muted)]">Registry</div>
              <div className="font-semibold">Agents</div>
            </div>
            <button
              className="button !py-2 !px-3"
              type="button"
              onClick={async () => {
                const title = prompt("Task title (creates an Inbox task)");
                if (!title) return;
                const { id } = await createTask({ title, tags: ["manual"] });
                await appendEvent({
                  type: "task",
                  title: "Task created",
                  detail: `Created ${title}`,
                  priority: "low",
                  taskId: id,
                });
              }}
            >
              + Task
            </button>
          </div>
          <div className="panelBody space-y-3">
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
                          : "")
                    }
                  >
                    {a.status}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="badge">
                    hb {Math.max(0, Math.round((Date.now() - a.lastHeartbeatAt) / 60000))}m
                  </span>
                  <span className="badge">tasks {a.taskCount}</span>
                  {a.currentTask ? (
                    <span className="badge">now: {a.currentTask}</span>
                  ) : null}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="button !py-2 !px-3" type="button" disabled>
                    Pause
                  </button>
                  <button className="button !py-2 !px-3" type="button" disabled>
                    Restart
                  </button>
                  <button className="button !py-2 !px-3" type="button" disabled>
                    Edit
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
              <div className="text-sm text-[color:var(--muted)]">Mission Queue</div>
              <div className="font-semibold">Kanban</div>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {columns.map((col) => (
                <div
                  key={col}
                  className="rounded-2xl border border-[rgba(255,255,255,0.10)] bg-[rgba(0,0,0,0.14)] overflow-hidden"
                >
                  <div className="px-3 py-2 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
                    <div className="font-semibold text-sm">{col}</div>
                    <span className="badge">
                      {filteredTasks.filter((t) => t.status === col).length}
                    </span>
                  </div>
                  <div className="p-3 space-y-3 min-h-[120px]">
                    {filteredTasks
                      .filter((t) => t.status === col)
                      .sort((a, b) => priorityScore(b) - priorityScore(a))
                      .map((t) => {
                        const score = priorityScore(t);
                        return (
                          <div
                            key={t._id}
                            className="rounded-2xl border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.03)] p-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="text-xs text-[color:rgba(245,246,250,0.55)]">
                                  {t.externalId ?? t._id}
                                </div>
                                <div className="font-semibold leading-5">
                                  {t.title}
                                </div>
                              </div>
                              <div className={"text-sm font-semibold " + scoreColor(score)}>
                                {score.toFixed(1)}
                              </div>
                            </div>

                            <div className="mt-2 text-sm text-[color:rgba(245,246,250,0.70)] leading-5">
                              {t.description}
                            </div>

                            <div className="mt-2 flex flex-wrap gap-2">
                              {(t.tags ?? []).map((tag) => (
                                <span key={tag} className="badge">
                                  {tag}
                                </span>
                              ))}
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                className="button !py-2 !px-3"
                                type="button"
                                onClick={async () => {
                                  await addDeliverable({
                                    taskId: t._id,
                                    kind: "Markdown",
                                    title: "MVP deliverable (placeholder)",
                                  });
                                  await appendEvent({
                                    type: "deliverable",
                                    title: "Deliverable added",
                                    detail: `Added placeholder deliverable to ${t.title}`,
                                    priority: "low",
                                    taskId: t._id,
                                  });
                                  alert("Deliverable added (placeholder). Now you can mark Done.");
                                }}
                              >
                                Add deliverable
                              </button>
                              <button
                                className="button !py-2 !px-3"
                                type="button"
                                onClick={async () => {
                                  try {
                                    await updateStatus({ taskId: t._id, status: "Done" });
                                    await appendEvent({
                                      type: "task",
                                      title: "Task updated",
                                      detail: `Marked Done: ${t.title}`,
                                      priority: "med",
                                      taskId: t._id,
                                    });
                                  } catch (err: any) {
                                    alert(err?.message ?? String(err));
                                  }
                                }}
                              >
                                Mark done
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 text-sm text-[color:var(--muted)]">
              Rule: tasks can’t be completed unless a deliverable exists.
              Prioritization: <span className="kbd">impact × confidence × urgency ÷ effort</span>.
            </div>
          </div>
        </section>

        {/* Right: Live Feed */}
        <section className="col-span-12 lg:col-span-3 panel overflow-hidden">
          <div className="panelHeader">
            <div className="text-sm text-[color:var(--muted)]">Realtime</div>
            <div className="font-semibold">Live Feed</div>
          </div>
          <div className="panelBody space-y-3">
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
                <div className="mt-2 flex flex-wrap gap-2">
                  {e.agentId ? <span className="badge">agent</span> : null}
                  <span className="badge">
                    {Math.max(0, Math.round((Date.now() - e.createdAt) / 60000))}m
                  </span>
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
            <div className="text-sm text-[color:var(--muted)]">
              Tip: <span className="kbd">⌘K</span> could open this in a real app.
            </div>
          </div>
          <div className="panelBody">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
              <div className="lg:col-span-9">
                <textarea
                  value={broadcast}
                  onChange={(e) => setBroadcast(e.target.value)}
                  className="input min-h-[92px]"
                  placeholder='Example: "Find podcasts I can appear on"\nExpected: agents fan out → create subtasks → return deliverables for approval.'
                />
              </div>
              <div className="lg:col-span-3 flex flex-col gap-2">
                <button
                  className="button justify-center"
                  type="button"
                  onClick={async () => {
                    const msg = broadcast.trim();
                    if (!msg) return;
                    await appendEvent({
                      type: "message",
                      title: "Broadcast",
                      detail: msg,
                      priority: "med",
                    });
                    setBroadcast("");
                    alert("Broadcast recorded (MVP). Next step: publish to OpenClaw task bus.");
                  }}
                  disabled={!broadcast.trim()}
                >
                  Send broadcast
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

      <footer className="mt-8 text-sm text-[color:var(--muted)]">
        Backed by Convex. Next step: wire OpenClaw → Mission Control via signed HTTP actions.
      </footer>
    </main>
  );
}
