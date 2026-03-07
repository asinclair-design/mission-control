import { Task, TaskWithSubtasks, TaskStatus } from "@/types/task";

/**
 * Calculate priority score for a task
 * Score = (impact × confidence × urgency) ÷ effort
 */
export function priorityScore(task: {
  impact: number;
  confidence: number;
  urgency: number;
  effort: number;
}): number {
  return (task.impact * task.confidence * task.urgency) / Math.max(1, task.effort);
}

/**
 * Get color class based on priority score
 */
export function scoreColor(score: number): string {
  if (score >= 18) return "text-[color:var(--amber)]";
  if (score >= 10) return "text-[color:rgba(51,230,255,0.95)]";
  return "text-[color:rgba(245,246,250,0.7)]";
}

/**
 * Build a hierarchical tree from flat tasks array
 */
export function buildTaskHierarchy(tasks: Task[]): TaskWithSubtasks[] {
  const taskMap = new Map<string, TaskWithSubtasks>();
  
  // Initialize all tasks with empty subtasks array
  for (const task of tasks) {
    taskMap.set(task._id, {
      ...task,
      subtasks: [],
      subtaskCount: 0,
    });
  }
  
  const rootTasks: TaskWithSubtasks[] = [];
  
  // Build hierarchy
  for (const task of tasks) {
    const taskWithSubs = taskMap.get(task._id)!;
    
    if (task.parentId && taskMap.has(task.parentId)) {
      // This is a subtask - add to parent's subtasks
      const parent = taskMap.get(task.parentId)!;
      parent.subtasks.push(taskWithSubs);
    } else {
      // This is a root task
      rootTasks.push(taskWithSubs);
    }
  }
  
  // Calculate subtask counts recursively
  const calculateSubtaskCount = (task: TaskWithSubtasks): number => {
    let count = task.subtasks.length;
    for (const subtask of task.subtasks) {
      count += calculateSubtaskCount(subtask);
    }
    task.subtaskCount = count;
    return count;
  };
  
  for (const task of rootTasks) {
    calculateSubtaskCount(task);
  }
  
  // Sort by display order (or creation time as fallback)
  const sortByOrder = (a: TaskWithSubtasks, b: TaskWithSubtasks): number => {
    return (a.displayOrder || a.createdAt) - (b.displayOrder || b.createdAt);
  };
  
  rootTasks.sort(sortByOrder);
  
  for (const task of rootTasks) {
    task.subtasks.sort(sortByOrder);
  }
  
  return rootTasks;
}

/**
 * Filter tasks by search query
 */
export function filterTasks(tasks: TaskWithSubtasks[], query: string): TaskWithSubtasks[] {
  const q = query.trim().toLowerCase();
  if (!q) return tasks;
  
  const matchesQuery = (task: Task): boolean => {
    const tags = (task.tags ?? []).join(" ").toLowerCase();
    return (
      task.title.toLowerCase().includes(q) ||
      task.description.toLowerCase().includes(q) ||
      tags.includes(q)
    );
  };
  
  const filterRecursive = (task: TaskWithSubtasks): TaskWithSubtasks | null => {
    const subtasks = task.subtasks
      .map(filterRecursive)
      .filter((t): t is TaskWithSubtasks => t !== null);
    
    if (matchesQuery(task) || subtasks.length > 0) {
      return { ...task, subtasks };
    }
    
    return null;
  };
  
  return tasks
    .map(filterRecursive)
    .filter((t): t is TaskWithSubtasks => t !== null);
}

/**
 * Get all task IDs in a hierarchy (for bulk operations)
 */
export function getAllTaskIds(task: TaskWithSubtasks): string[] {
  const ids = [task._id];
  for (const subtask of task.subtasks) {
    ids.push(...getAllTaskIds(subtask));
  }
  return ids;
}

/**
 * Format time ago string
 */
export function timeAgo(ms: number): string {
  const diff = Math.max(0, Date.now() - ms);
  if (diff < 60_000) return "<1m";
  if (diff < 3600_000) return Math.round(diff / 60_000) + "m";
  if (diff < 86400_000) return Math.round(diff / 3600_000) + "h";
  return Math.round(diff / 86400_000) + "d";
}

/**
 * Format date for display
 */
export function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format datetime for display
 */
export function formatDateTime(ms: number): string {
  return new Date(ms).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Get status badge color class
 */
export function statusBadgeClass(status: TaskStatus): string {
  switch (status) {
    case "Done":
      return "!text-[color:var(--ok)] !border-[rgba(41,214,125,0.35)]";
    case "In Progress":
      return "!text-[color:var(--cyan)] !border-[rgba(51,230,255,0.35)]";
    case "Review":
      return "!text-[color:var(--amber)] !border-[rgba(255,176,32,0.35)]";
    case "Waiting":
      return "!text-[color:var(--danger)] !border-[rgba(255,77,77,0.35)]";
    default:
      return "";
  }
}

/**
 * Get agent status color class
 */
export function agentStatusClass(status: string): string {
  switch (status) {
    case "active":
      return "!text-[color:var(--ok)]";
    case "error":
      return "!text-[color:var(--danger)]";
    case "paused":
      return "!text-[color:var(--amber)]";
    default:
      return "";
  }
}
