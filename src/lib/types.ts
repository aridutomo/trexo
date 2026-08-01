// ============================================================
// Trexo — Domain types (mirror struktur database pada spec)
// ============================================================

export type WorkspaceType = "personal" | "company";

export type TaskStatus = "todo" | "in_progress" | "review" | "done";

export type TaskSource = "own_idea" | "user_request";

export type TaskDifficulty = "easy" | "medium" | "hard";

export interface User {
  id: string;
  name: string;
  email: string;
  avatarColor: string; // warna avatar default (initials)
  authProvider: "email" | "google" | "github";
}

export interface Workspace {
  id: string;
  name: string;
  type: WorkspaceType;
  ownerId: string;
  color: string; // warna aksen workspace di sidebar
  createdAt: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  icon: string; // emoji
  color: string;
  createdAt: string;
}

export interface TaskStep {
  id: string;
  name: string;
  completed: boolean;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  name: string;
  description: string;
  status: TaskStatus;
  source: TaskSource;
  difficulty: TaskDifficulty;
  steps: TaskStep[];
  assigneeId?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Konstanta label & metadata untuk UI
// ============================================================

export const STATUS_META: Record<
  TaskStatus,
  { label: string; color: string; bg: string; text: string; dot: string; order: number }
> = {
  todo: {
    label: "To Do",
    color: "slate",
    bg: "bg-slate-100",
    text: "text-slate-600",
    dot: "bg-slate-400",
    order: 0,
  },
  in_progress: {
    label: "In Progress",
    color: "blue",
    bg: "bg-blue-50",
    text: "text-blue-600",
    dot: "bg-blue-500",
    order: 1,
  },
  review: {
    label: "Review",
    color: "amber",
    bg: "bg-amber-50",
    text: "text-amber-600",
    dot: "bg-amber-500",
    order: 2,
  },
  done: {
    label: "Done",
    color: "emerald",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    dot: "bg-emerald-500",
    order: 3,
  },
};

export const DIFFICULTY_META: Record<
  TaskDifficulty,
  { label: string; bg: string; text: string; ring: string; value: number }
> = {
  easy: {
    label: "Mudah",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "ring-emerald-200",
    value: 1,
  },
  medium: {
    label: "Medium",
    bg: "bg-amber-50",
    text: "text-amber-700",
    ring: "ring-amber-200",
    value: 2,
  },
  hard: {
    label: "Susah",
    bg: "bg-rose-50",
    text: "text-rose-700",
    ring: "ring-rose-200",
    value: 3,
  },
};

export const SOURCE_META: Record<TaskSource, { label: string; bg: string; text: string }> = {
  own_idea: { label: "Ide Sendiri", bg: "bg-sky-50", text: "text-sky-700" },
  user_request: { label: "Permintaan User", bg: "bg-violet-50", text: "text-violet-700" },
};

export const STATUS_ORDER: TaskStatus[] = ["todo", "in_progress", "review", "done"];

// Persentase fallback ketika task TIDAK punya steps
export const STATUS_FALLBACK_PROGRESS: Record<TaskStatus, number> = {
  todo: 0,
  in_progress: 50,
  review: 75,
  done: 100,
};
