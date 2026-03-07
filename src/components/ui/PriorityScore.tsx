import { priorityScore, scoreColor } from "@/lib/taskUtils";

interface PriorityScoreProps {
  task: {
    impact: number;
    confidence: number;
    urgency: number;
    effort: number;
  };
  showLabel?: boolean;
  className?: string;
}

/**
 * Priority score display with color coding
 */
export function PriorityScore({
  task,
  showLabel = false,
  className = "",
}: PriorityScoreProps) {
  const score = priorityScore(task);

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {showLabel && (
        <span className="text-[10px] text-[color:var(--muted)]">Score</span>
      )}
      <span className={`text-xs font-semibold ${scoreColor(score)}`}>
        {score.toFixed(0)}
      </span>
    </div>
  );
}
