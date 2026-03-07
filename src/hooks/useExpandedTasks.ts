"use client";

import { useState, useCallback } from "react";

interface UseExpandedTasksReturn {
  expandedTasks: Set<string>;
  isExpanded: (taskId: string) => boolean;
  toggleExpand: (taskId: string) => void;
  expandAll: (taskIds: string[]) => void;
  collapseAll: () => void;
  expandTask: (taskId: string) => void;
  collapseTask: (taskId: string) => void;
}

/**
 * Hook to manage expanded/collapsed state of tasks
 */
export function useExpandedTasks(): UseExpandedTasksReturn {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const isExpanded = useCallback(
    (taskId: string) => expandedTasks.has(taskId),
    [expandedTasks]
  );

  const toggleExpand = useCallback((taskId: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }, []);

  const expandTask = useCallback((taskId: string) => {
    setExpandedTasks((prev) => new Set(prev).add(taskId));
  }, []);

  const collapseTask = useCallback((taskId: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      next.delete(taskId);
      return next;
    });
  }, []);

  const expandAll = useCallback((taskIds: string[]) => {
    setExpandedTasks(new Set(taskIds));
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedTasks(new Set());
  }, []);

  return {
    expandedTasks,
    isExpanded,
    toggleExpand,
    expandAll,
    collapseAll,
    expandTask,
    collapseTask,
  };
}
