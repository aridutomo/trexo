import * as XLSX from "xlsx";
import { computeProgress } from "./utils";
import {
  DIFFICULTY_META,
  SOURCE_META,
  STATUS_META,
  type Project,
  type Task,
} from "./types";

interface ExportContext {
  tasks: Task[];
  projectName?: string;
  fileName?: string;
}

/**
 * Export daftar task ke file .xlsx langsung dari browser (best practice frontend).
 * Tidak membebani server — SheetJS menyusun workbook dari data JSON.
 */
export function exportTasksToExcel({ tasks, projectName, fileName }: ExportContext): void {
  const rows = tasks.map((t) => {
    const meta = STATUS_META[t.status];
    return {
      "Nama Task": t.name,
      Deskripsi: t.description,
      Status: meta.label,
      "Sumber Ide": SOURCE_META[t.source].label,
      Kesulitan: DIFFICULTY_META[t.difficulty].label,
      "Steps Selesai": `${t.steps.filter((s) => s.completed).length}/${t.steps.length}`,
      "Progress (%)": computeProgress(t),
      "Jatuh Tempo": t.dueDate ? new Date(t.dueDate).toLocaleDateString("id-ID") : "-",
      Dibuat: new Date(t.createdAt).toLocaleDateString("id-ID"),
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = [
    { wch: 32 },
    { wch: 40 },
    { wch: 14 },
    { wch: 16 },
    { wch: 10 },
    { wch: 14 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Tasks");

  const base = fileName ?? projectName ?? "trexo-report";
  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `${base}-${stamp}.xlsx`);
}

/** Susun ringkasan agregat untuk HTML preview & report. */
export interface ReportSummary {
  total: number;
  byStatus: Record<Task["status"], number>;
  byDifficulty: Record<Task["difficulty"], number>;
  bySource: Record<Task["source"], number>;
  doneCount: number;
  overallProgress: number;
}

export function buildSummary(tasks: Task[]): ReportSummary {
  const byStatus = { todo: 0, in_progress: 0, review: 0, done: 0 };
  const byDifficulty = { easy: 0, medium: 0, hard: 0 };
  const bySource = { own_idea: 0, user_request: 0 };

  for (const t of tasks) {
    byStatus[t.status]++;
    byDifficulty[t.difficulty]++;
    bySource[t.source]++;
  }

  const doneCount = byStatus.done;
  const overallProgress =
    tasks.length === 0
      ? 0
      : Math.round(tasks.reduce((acc, t) => acc + computeProgress(t), 0) / tasks.length);

  return {
    total: tasks.length,
    byStatus,
    byDifficulty,
    bySource,
    doneCount,
    overallProgress,
  };
}

export { DIFFICULTY_META, SOURCE_META, STATUS_META };
export type { Project };
