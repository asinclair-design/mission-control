"use client";

import { ChevronRight } from "lucide-react";

interface ExpandToggleProps {
  isExpanded: boolean;
  onToggle: () => void;
  hasChildren: boolean;
  count?: number;
}

/**
 * Chevron toggle button for expanding/collapsing task trees
 */
export function ExpandToggle({
  isExpanded,
  onToggle,
  hasChildren,
  count,
}: ExpandToggleProps) {
  if (!hasChildren) {
    return <div className="w-6" />; // Spacer for alignment
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className="flex items-center gap-1 p-1 rounded hover:bg-white/10 transition-colors"
      type="button"
      aria-label={isExpanded ? "Collapse" : "Expand"}
    >
      <ChevronRight
        className={`w-4 h-4 transition-transform duration-200 ${
          isExpanded ? "rotate-90" : ""
        }`}
      />
      {count !== undefined && count > 0 && (
        <span className="text-[10px] text-[color:var(--muted)]">{count}</span>
      )}
    </button>
  );
}
