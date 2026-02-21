export type AgentStatus = "active" | "idle" | "error";

export type Agent = {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  lastHeartbeatMin: number;
  taskCount: number;
  currentTask?: string;
};

export type TaskStatus = "Inbox" | "Assigned" | "In Progress" | "Review" | "Waiting" | "Done";

export type Deliverable = {
  kind: "Markdown" | "URL" | "JSON" | "Screenshot";
  title: string;
  href?: string;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignedAgents: string[];
  tags: string[];
  createdMin: number;
  impact: number; // 1-5
  confidence: number; // 1-5
  urgency: number; // 1-5
  effort: number; // 1-5
  deliverables: Deliverable[];
};

export type FeedEvent = {
  id: string;
  tsMin: number;
  type: "message" | "deliverable" | "error" | "insight" | "approval" | "task";
  agent?: string;
  title: string;
  detail: string;
  priority?: "low" | "med" | "high";
};

export const agents: Agent[] = [
  {
    id: "orchestrator",
    name: "Orchestrator",
    role: "Jarvis-type coordinator",
    status: "active",
    lastHeartbeatMin: 1,
    taskCount: 7,
    currentTask: "triaging mission queue",
  },
  {
    id: "researcher",
    name: "Scout",
    role: "Research & synthesis",
    status: "active",
    lastHeartbeatMin: 3,
    taskCount: 4,
    currentTask: "finding podcast targets",
  },
  {
    id: "developer",
    name: "Builder",
    role: "Implementation",
    status: "idle",
    lastHeartbeatMin: 9,
    taskCount: 2,
  },
  {
    id: "reviewer",
    name: "Gatekeeper",
    role: "Review & approvals",
    status: "idle",
    lastHeartbeatMin: 12,
    taskCount: 1,
  },
  {
    id: "watcher",
    name: "Sentinel",
    role: "Monitoring & alerts",
    status: "error",
    lastHeartbeatMin: 18,
    taskCount: 3,
    currentTask: "reddit monitor cron",
  },
];

export const tasks: Task[] = [
  {
    id: "MC-001",
    title: "Stand up Mission Control MVP UI",
    description: "Left agent registry, kanban queue, live feed, broadcast console. Mock data + docs.",
    status: "In Progress",
    assignedAgents: ["orchestrator", "developer"],
    tags: ["mvp", "ui", "nextjs"],
    createdMin: 52,
    impact: 5,
    confidence: 4,
    urgency: 4,
    effort: 3,
    deliverables: [{ kind: "URL", title: "Vercel preview", href: "#" }],
  },
  {
    id: "MC-002",
    title: "Define agent protocol contract",
    description: "heartbeat(), fetch_new_tasks(), post_updates(), submit_deliverable(), ask_question().",
    status: "Review",
    assignedAgents: ["orchestrator", "reviewer"],
    tags: ["spec", "protocol"],
    createdMin: 140,
    impact: 4,
    confidence: 4,
    urgency: 3,
    effort: 2,
    deliverables: [{ kind: "Markdown", title: "Protocol spec" }],
  },
  {
    id: "MC-003",
    title: "Prioritization engine formula",
    description: "priority_score = impact × confidence × urgency ÷ effort; display rank + color.",
    status: "Assigned",
    assignedAgents: ["researcher"],
    tags: ["scoring"],
    createdMin: 23,
    impact: 3,
    confidence: 5,
    urgency: 2,
    effort: 1,
    deliverables: [{ kind: "JSON", title: "Sample scores" }],
  },
  {
    id: "MC-004",
    title: "Audit log + event schema",
    description: "Define append-only event table + severity mapping.",
    status: "Inbox",
    assignedAgents: [],
    tags: ["db"],
    createdMin: 8,
    impact: 4,
    confidence: 3,
    urgency: 2,
    effort: 2,
    deliverables: [],
  },
];

export const feed: FeedEvent[] = [
  {
    id: "ev1",
    tsMin: 1,
    type: "message",
    agent: "Orchestrator",
    title: "Queue synced",
    detail: "Pulled 6 tasks, re-ranked 2 by urgency.",
    priority: "med",
  },
  {
    id: "ev2",
    tsMin: 4,
    type: "deliverable",
    agent: "Scout",
    title: "Deliverable uploaded",
    detail: "Podcast target list (v1).",
    priority: "low",
  },
  {
    id: "ev3",
    tsMin: 9,
    type: "error",
    agent: "Sentinel",
    title: "Cron error",
    detail: "Reddit monitor produced results but flagged error state (needs retry logic).",
    priority: "high",
  },
  {
    id: "ev4",
    tsMin: 12,
    type: "approval",
    agent: "Gatekeeper",
    title: "Approval needed",
    detail: "Approve posting draft response on r/InjectionMolding.",
    priority: "med",
  },
];

export function priorityScore(t: Task) {
  return (t.impact * t.confidence * t.urgency) / Math.max(1, t.effort);
}
