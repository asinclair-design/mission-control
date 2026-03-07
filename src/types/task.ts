// Type definitions for task hierarchy

export type TaskStatus =
  | "Inbox"
  | "Assigned"
  | "In Progress"
  | "Review"
  | "Waiting"
  | "Done";

export interface Task {
  _id: string;
  _creationTime: number;
  externalId?: string;
  title: string;
  description: string;
  status: TaskStatus;
  parentId?: string;
  isProject?: boolean;
  displayOrder?: number;
  assignedAgentIds: string[];
  tags: string[];
  createdAt: number;
  updatedAt: number;
  impact: number;
  confidence: number;
  urgency: number;
  effort: number;
  embedding?: number[];
}

export interface TaskWithSubtasks extends Task {
  subtasks: TaskWithSubtasks[];
  subtaskCount: number;  // Total including nested
}

export interface Agent {
  _id: string;
  name: string;
  role: string;
  status: "active" | "idle" | "error" | "paused";
  lastHeartbeatAt: number;
  taskCount: number;
  currentTask?: string;
  capabilities?: string[];
}

export interface Deliverable {
  _id: string;
  taskId: string;
  kind: "Markdown" | "URL" | "JSON" | "Screenshot" | "PDF";
  title: string;
  href?: string;
  payload?: any;
  createdAt: number;
  createdByAgentId?: string;
}

// Component prop types
export interface TaskCardProps {
  task: TaskWithSubtasks;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onClick: () => void;
  depth?: number;
  agents: Agent[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onAddDeliverable: (taskId: string) => void;
}

export interface SubtaskCardProps {
  task: Task;
  depth: number;
  onClick: () => void;
  agents: Agent[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
}

export interface ProjectCardProps {
  task: TaskWithSubtasks;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onClick: () => void;
  agents: Agent[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
}

export interface TaskBoardProps {
  tasks: TaskWithSubtasks[];
  agents: Agent[];
  onTaskClick: (taskId: string) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onAddDeliverable: (taskId: string) => void;
  filterQuery?: string;
}

export interface TaskDetailDrawerProps {
  task: Task | null;
  agents: Agent[];
  deliverables: Deliverable[];
  subtasks: Task[];
  onClose: () => void;
  onAddDeliverable: () => void;
  onUpdateStatus: (status: TaskStatus) => void;
  onCreateSubtask: (title: string) => void;
}
