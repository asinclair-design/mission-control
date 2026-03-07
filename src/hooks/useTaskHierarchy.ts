import { useMemo } from "react";
import { Task } from "@/types/task";
import { buildTaskHierarchy, filterTasks } from "@/lib/taskUtils";

interface UseTaskHierarchyOptions {
  tasks: Task[];
  filterQuery?: string;
  groupByStatus?: boolean;
}

interface UseTaskHierarchyReturn {
  /** Root-level tasks with nested subtasks */
  hierarchicalTasks: ReturnType<typeof buildTaskHierarchy>;
  /** Flat list of all tasks for status columns */
  allRootTasks: Task[];
  /** Tasks grouped by status */
  tasksByStatus: Record<string, ReturnType<typeof buildTaskHierarchy>>;
  /** Total count including subtasks */
  totalTaskCount: number;
  /** Count of root-level tasks only */
  rootTaskCount: number;
}

/**
 * Hook to process flat tasks into hierarchical structure
 */
export function useTaskHierarchy(options: UseTaskHierarchyOptions): UseTaskHierarchyReturn {
  const { tasks, filterQuery, groupByStatus = true } = options;

  const hierarchicalTasks = useMemo(() => {
    const hierarchy = buildTaskHierarchy(tasks);
    if (filterQuery) {
      return filterTasks(hierarchy, filterQuery);
    }
    return hierarchy;
  }, [tasks, filterQuery]);

  const allRootTasks = useMemo(() => {
    return tasks.filter((t) => !t.parentId);
  }, [tasks]);

  const tasksByStatus = useMemo(() => {
    if (!groupByStatus) return {};

    const statuses = ["Inbox", "Assigned", "In Progress", "Review", "Waiting", "Done"] as const;
    const grouped: Record<string, ReturnType<typeof buildTaskHierarchy>> = {};

    for (const status of statuses) {
      const statusTasks = tasks.filter((t) => t.status === status);
      const hierarchy = buildTaskHierarchy(statusTasks);
      grouped[status] = filterQuery ? filterTasks(hierarchy, filterQuery) : hierarchy;
    }

    return grouped;
  }, [tasks, filterQuery, groupByStatus]);

  const totalTaskCount = tasks.length;
  const rootTaskCount = allRootTasks.length;

  return {
    hierarchicalTasks,
    allRootTasks,
    tasksByStatus,
    totalTaskCount,
    rootTaskCount,
  };
}
