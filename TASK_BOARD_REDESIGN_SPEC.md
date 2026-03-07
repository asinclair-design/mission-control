# Mission Control Task Board Redesign - Technical Specification

## Overview
This document provides a comprehensive technical specification for redesigning the Mission Control dashboard task board to improve readability and establish clear visual hierarchy between main tasks and subtasks.

---

## 1. Current State Analysis

### Problems Identified
1. **Flat Structure**: All tasks are displayed at the same level with no parent/child relationship
2. **Visual Clutter**: Cards are dense with information, making scanning difficult
3. **No Hierarchy**: No distinction between projects, main tasks, and subtasks
4. **Limited Context**: Task relationships are not visible in the board view

### Current Data Model (Convex Schema)
```typescript
// Current tasks table - flat structure
tasks: defineTable({
  externalId: v.optional(v.string()),
  title: v.string(),
  description: v.string(),
  status: v.union(v.literal("Inbox"), v.literal("Assigned"), ...),
  assignedAgentIds: v.array(v.id("agents")),
  tags: v.array(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
  impact: v.number(),
  confidence: v.number(),
  urgency: v.number(),
  effort: v.number(),
  embedding: v.optional(v.array(v.number())),
})
```

---

## 2. Proposed Data Model Changes

### 2.1 Updated Schema (convex/schema.ts)

```typescript
// Enhanced tasks table with hierarchy support
tasks: defineTable({
  externalId: v.optional(v.string()),
  title: v.string(),
  description: v.string(),
  status: v.union(
    v.literal("Inbox"),
    v.literal("Assigned"),
    v.literal("In Progress"),
    v.literal("Review"),
    v.literal("Waiting"),
    v.literal("Done")
  ),
  
  // Hierarchy fields (NEW)
  parentId: v.optional(v.id("tasks")),        // Reference to parent task
  isProject: v.optional(v.boolean()),          // True if this is a project-level task
  displayOrder: v.optional(v.number()),        // For manual ordering within parent
  
  // Metadata
  assignedAgentIds: v.array(v.id("agents")),
  tags: v.array(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
  
  // Prioritization
  impact: v.number(),
  confidence: v.number(),
  urgency: v.number(),
  effort: v.number(),
  
  // Vector search
  embedding: v.optional(v.array(v.number())),
})
  .index("by_status", ["status"])
  .index("by_externalId", ["externalId"])
  .index("by_parentId", ["parentId"])           // NEW: For fetching subtasks
  .index("by_isProject", ["isProject"])         // NEW: For filtering projects
  .index("by_displayOrder", ["displayOrder"]);  // NEW: For ordering
```

### 2.2 Migration Strategy

```typescript
// convex/migrations/addTaskHierarchy.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const migrateAddHierarchyFields = mutation({
  args: {},
  handler: async (ctx) => {
    const tasks = await ctx.db.query("tasks").collect();
    
    for (const task of tasks) {
      // Set default values for new fields
      await ctx.db.patch(task._id, {
        parentId: undefined,
        isProject: false,  // Existing tasks become regular tasks
        displayOrder: task.createdAt,  // Default to creation time
      });
    }
    
    return { migrated: tasks.length };
  },
});
```

---

## 3. UI/UX Design Specification

### 3.1 Visual Hierarchy Levels

| Level | Type | Visual Treatment | Card Size |
|-------|------|------------------|-----------|
| 1 | Project | Full-width, distinct background, larger typography | 100% width |
| 2 | Main Task | Standard card with expand/collapse toggle | 100% width |
| 3 | Subtask | Indented, smaller card, muted styling | ~95% width, indented |

### 3.2 Color Coding System

```css
/* Project Cards */
--project-bg: rgba(255, 176, 32, 0.08);
--project-border: rgba(255, 176, 32, 0.25);
--project-accent: #ffb020;

/* Main Task Cards */
--task-bg: rgba(255, 255, 255, 0.03);
--task-border: rgba(255, 255, 255, 0.10);
--task-hover: rgba(255, 176, 32, 0.15);

/* Subtask Cards */
--subtask-bg: rgba(0, 0, 0, 0.20);
--subtask-border: rgba(255, 255, 255, 0.06);
--subtask-text: rgba(245, 246, 250, 0.75);
```

### 3.3 ClickUp-Inspired Interactions

1. **Expand/Collapse Toggle**
   - Chevron icon rotates 90° when expanded
   - Smooth height animation (300ms ease-out)
   - Shows/hides subtasks inline

2. **Task Detail Drawer** (Existing - Keep)
   - Click anywhere on card (except buttons) opens drawer
   - Shows full task details including subtasks list
   - Slide-in from right

3. **Quick Actions**
   - Status change dropdown on hover
   - "+ Subtask" button on main tasks
   - Drag handle for reordering (future)

---

## 4. Component Structure

### 4.1 New Component Architecture

```
src/
├── app/
│   ├── page.tsx                    # Main dashboard (refactored)
│   └── globals.css                 # Add new CSS variables
├── components/
│   ├── task-board/
│   │   ├── TaskBoard.tsx           # Main container
│   │   ├── TaskColumn.tsx          # Kanban column wrapper
│   │   ├── ProjectCard.tsx         # Level 1: Project display
│   │   ├── TaskCard.tsx            # Level 2: Main task with expand
│   │   ├── SubtaskCard.tsx         # Level 3: Subtask display
│   │   ├── TaskTree.tsx            # Recursive tree renderer
│   │   └── TaskDetailDrawer.tsx    # Extracted from page.tsx
│   └── ui/
│       ├── ExpandToggle.tsx        # Chevron with animation
│       ├── StatusBadge.tsx         # Status indicator
│       ├── PriorityScore.tsx       # Score display
│       └── SubtaskCounter.tsx      # "3 subtasks" indicator
├── hooks/
│   ├── useTaskHierarchy.ts         # Fetch tasks with children
│   └── useExpandedTasks.ts         # Manage expanded state
├── lib/
│   └── taskUtils.ts                # Hierarchy helpers
└── types/
    └── task.ts                     # TypeScript definitions
```

### 4.2 Component Specifications

#### TaskBoard.tsx
```typescript
interface TaskBoardProps {
  tasks: TaskWithSubtasks[];
  agents: Agent[];
  onTaskClick: (taskId: string) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
}

// Groups tasks by status, renders columns
// Filters to show only top-level items by default
// Handles expand/collapse state
```

#### TaskCard.tsx (Main Task)
```typescript
interface TaskCardProps {
  task: TaskWithSubtasks;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onClick: () => void;
  subtasks: Task[];
}

// Visual hierarchy indicator
// Expand toggle (if has subtasks)
// Subtask counter badge
// Quick action buttons
```

#### SubtaskCard.tsx
```typescript
interface SubtaskCardProps {
  task: Task;
  depth: number;  // For indentation
  onClick: () => void;
}

// Indented with left border
// Smaller typography
// Simplified display (no expand)
```

---

## 5. Convex API Changes

### 5.1 New Queries (convex/tasks.ts)

```typescript
// Get tasks with their subtasks
export const listWithHierarchy = query({
  args: {
    status: v.optional(v.union(
      v.literal("Inbox"),
      v.literal("Assigned"),
      v.literal("In Progress"),
      v.literal("Review"),
      v.literal("Waiting"),
      v.literal("Done")
    )),
    includeSubtasks: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let tasks = await ctx.db.query("tasks").collect();
    
    if (args.status) {
      tasks = tasks.filter(t => t.status === args.status);
    }
    
    // Build hierarchy
    const taskMap = new Map(tasks.map(t => [t._id, { ...t, subtasks: [] }]));
    const rootTasks: TaskWithSubtasks[] = [];
    
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
    
    // Sort by display order
    rootTasks.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    
    return rootTasks;
  },
});

// Get subtasks for a specific task
export const listSubtasks = query({
  args: { parentId: v.id("tasks") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_parentId", (q) => q.eq("parentId", args.parentId))
      .order("asc")
      .collect();
  },
});

// Get only project-level tasks
export const listProjects = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_isProject", (q) => q.eq("isProject", true))
      .order("desc")
      .collect();
  },
});
```

### 5.2 New Mutations

```typescript
// Create a subtask
export const createSubtask = mutation({
  args: {
    parentId: v.id("tasks"),
    title: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const parent = await ctx.db.get(args.parentId);
    if (!parent) throw new Error("Parent task not found");
    
    const now = Date.now();
    const id = await ctx.db.insert("tasks", {
      title: args.title,
      description: args.description ?? "",
      status: "Inbox",
      parentId: args.parentId,
      isProject: false,
      displayOrder: now,
      assignedAgentIds: [],
      tags: [],
      createdAt: now,
      updatedAt: now,
      impact: 3,
      confidence: 3,
      urgency: 3,
      effort: 3,
    });
    
    return { id };
  },
});

// Convert task to project
export const convertToProject = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, {
      isProject: true,
      updatedAt: Date.now(),
    });
  },
});

// Reorder tasks
export const updateDisplayOrder = mutation({
  args: {
    taskId: v.id("tasks"),
    displayOrder: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, {
      displayOrder: args.displayOrder,
      updatedAt: Date.now(),
    });
  },
});
```

---

## 6. Implementation Plan

### Phase 1: Data Layer (1-2 hours)
1. [ ] Update `convex/schema.ts` with new fields and indexes
2. [ ] Create migration script for existing tasks
3. [ ] Add new queries (`listWithHierarchy`, `listSubtasks`, `listProjects`)
4. [ ] Add new mutations (`createSubtask`, `convertToProject`, `updateDisplayOrder`)
5. [ ] Run `npx convex dev` to apply schema changes

### Phase 2: Type Definitions (30 min)
1. [ ] Create `src/types/task.ts` with TypeScript interfaces
2. [ ] Create `src/lib/taskUtils.ts` with hierarchy helpers

### Phase 3: UI Components (3-4 hours)
1. [ ] Create base UI components (`ExpandToggle`, `StatusBadge`, `PriorityScore`)
2. [ ] Create `SubtaskCard` component
3. [ ] Refactor existing task card into `TaskCard` with expand functionality
4. [ ] Create `ProjectCard` component
5. [ ] Create `TaskTree` recursive component
6. [ ] Extract `TaskDetailDrawer` from page.tsx

### Phase 4: Integration (2-3 hours)
1. [ ] Create `useTaskHierarchy` hook
2. [ ] Create `useExpandedTasks` hook for state management
3. [ ] Refactor `TaskBoard` component
4. [ ] Update main `page.tsx` to use new TaskBoard

### Phase 5: Styling & Polish (1-2 hours)
1. [ ] Add new CSS variables to globals.css
2. [ ] Implement hover states and transitions
3. [ ] Test expand/collapse animations
4. [ ] Verify responsive behavior

### Phase 6: Testing & Deployment (1 hour)
1. [ ] Test with existing data
2. [ ] Create sample project with subtasks
3. [ ] Verify all status transitions work
4. [ ] Deploy to Vercel

---

## 7. File Changes Summary

### New Files
```
src/components/task-board/TaskBoard.tsx
src/components/task-board/TaskColumn.tsx
src/components/task-board/ProjectCard.tsx
src/components/task-board/TaskCard.tsx
src/components/task-board/SubtaskCard.tsx
src/components/task-board/TaskTree.tsx
src/components/task-board/TaskDetailDrawer.tsx
src/components/ui/ExpandToggle.tsx
src/components/ui/StatusBadge.tsx
src/components/ui/PriorityScore.tsx
src/components/ui/SubtaskCounter.tsx
src/hooks/useTaskHierarchy.ts
src/hooks/useExpandedTasks.ts
src/lib/taskUtils.ts
src/types/task.ts
convex/migrations/addTaskHierarchy.ts
```

### Modified Files
```
convex/schema.ts              # Add hierarchy fields and indexes
convex/tasks.ts               # Add new queries and mutations
src/app/page.tsx              # Refactor to use new TaskBoard
src/app/globals.css           # Add new CSS variables
```

### Deleted Files
```
None - TaskDrawer logic moves to TaskDetailDrawer.tsx
```

---

## 8. UX Behavior Specification

### 8.1 Default View
- Show only top-level tasks (no parentId)
- Projects (`isProject: true`) appear first in each column
- Each task shows subtask count if it has children
- "Expand" chevron only visible on tasks with subtasks

### 8.2 Expand/Collapse Behavior
- Click chevron to toggle subtask visibility
- Expanded state persists during session (React state)
- Subtasks appear indented below parent with left border
- Smooth animation: height 0 → auto (300ms ease-out)

### 8.3 Task Detail Drawer
- Click task card (not buttons) opens drawer from right
- Drawer shows full task details
- Subtasks listed in drawer with checkboxes
- "Add Subtask" button in drawer

### 8.4 Keyboard Shortcuts (Future Enhancement)
- `E` - Expand/collapse selected task
- `→` - Open task detail
- `N` - Create new task
- `Shift+N` - Create subtask

---

## 9. Example Data Flow

### Creating a Project with Subtasks

```typescript
// 1. Create project
const projectId = await createTask({
  title: "Q1 Marketing Campaign",
  isProject: true,
});

// 2. Create main tasks
const task1 = await createTask({
  title: "Design Landing Page",
  parentId: projectId,  // Or keep separate and link via projectId
});

// 3. Create subtasks
await createSubtask({
  parentId: task1,
  title: "Create wireframes",
});

await createSubtask({
  parentId: task1,
  title: "Design hero section",
});
```

---

## 10. Success Metrics

1. **Visual Clarity**: Users can distinguish projects, tasks, and subtasks at a glance
2. **Information Density**: 30% more tasks visible on screen without scrolling
3. **Interaction Efficiency**: 50% reduction in clicks to view subtask details
4. **User Satisfaction**: Subjective feedback on "ease of finding tasks"

---

## Appendix: Reference Implementations

### ClickUp Hierarchy Patterns
- Collapsible task lists with inline subtasks
- Visual indentation with connecting lines
- Progress indicators on parent tasks
- Quick-add subtask inline

### Recommended Libraries
- `@radix-ui/react-collapsible` - For expand/collapse
- `framer-motion` - For smooth animations (optional)
- `@dnd-kit/core` - For future drag-and-drop reordering
