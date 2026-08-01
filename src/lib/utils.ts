import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isToday, isPast } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  STATUS_FALLBACK_PROGRESS,
  type Task,
  type TaskStatus,
} from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** ID sederhana untuk mock layer (cukup unik di browser). */
export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
}

/**
 * Perhitungan progress otomatis sesuai spec:
 * - Jika task punya steps: (steps selesai / total steps) * 100
 * - Jika TIDAK punya steps: diikat ke status Kanban (To Do=0, In Progress=50, Review=75, Done=100)
 */
export function computeProgress(task: Pick<Task, "steps" | "status">): number {
  if (task.steps.length > 0) {
    const done = task.steps.filter((s) => s.completed).length;
    return Math.round((done / task.steps.length) * 100);
  }
  return STATUS_FALLBACK_PROGRESS[task.status];
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function formatDate(date: string | Date, pattern = "d MMM yyyy"): string {
  return format(new Date(date), pattern, { locale: localeId });
}

export function formatRelative(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: localeId });
}

export function isOverdue(task: Pick<Task, "dueDate" | "status">): boolean {
  if (!task.dueDate || task.status === "done") return false;
  const d = new Date(task.dueDate);
  return isPast(d) && !isToday(d);
}

export function statusLabel(status: TaskStatus): string {
  const map: Record<TaskStatus, string> = {
    todo: "To Do",
    in_progress: "In Progress",
    review: "Review",
    done: "Done",
  };
  return map[status];
}

/** Persentase clamped untuk progress bar. */
export function clampPercent(n: number): number {
  return Math.max(0, Math.min(100, n));
}
