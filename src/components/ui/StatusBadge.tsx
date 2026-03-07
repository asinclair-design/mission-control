import { TaskStatus } from "@/types/task";
import { statusBadgeClass } from "@/lib/taskUtils";

interface StatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

/**
 * Status badge with appropriate color coding
 */
export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  return (
    <span className={`badge ${statusBadgeClass(status)} ${className}`}>
      {status}
    </span>
  );
}
