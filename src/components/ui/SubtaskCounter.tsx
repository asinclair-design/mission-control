interface SubtaskCounterProps {
  count: number;
  completedCount?: number;
  className?: string;
}

/**
 * Badge showing subtask count with optional completion status
 */
export function SubtaskCounter({
  count,
  completedCount,
  className = "",
}: SubtaskCounterProps) {
  if (count === 0) return null;

  const showCompletion = completedCount !== undefined;

  return (
    <span
      className={`badge !text-[10px] !py-0 !px-1.5 ${className}`}
      title={`${count} subtask${count !== 1 ? "s" : ""}`}
    >
      {showCompletion ? (
        <>
          <span className="text-[color:var(--ok)]">{completedCount}</span>
          <span className="text-[color:var(--muted)]">/{count}</span>
        </>
      ) : (
        `${count} sub`
      )}
    </span>
  );
}
