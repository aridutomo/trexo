"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Clock } from "lucide-react";
import { useTrexo } from "@/lib/store";
import { Badge } from "@/components/ui/Badge";
import { formatRelative } from "@/lib/utils";
import type { TaskDifficulty } from "@/lib/types";

const difficultyTone: Record<TaskDifficulty, "emerald" | "amber" | "rose"> = {
  easy: "emerald",
  medium: "amber",
  hard: "rose",
};
const difficultyLabel: Record<TaskDifficulty, string> = {
  easy: "Mudah",
  medium: "Medium",
  hard: "Susah",
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export function MobileSearchOverlay({ open, onClose }: Props) {
  const router = useRouter();
  const tasks = useTrexo((s) => s.tasks);
  const projects = useTrexo((s) => s.projects);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Lock scroll + focus when open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => {
      document.body.style.overflow = prev;
      clearTimeout(t);
    };
  }, [open]);

  // Reset on close
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = [...tasks].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
    const filtered = q ? base.filter((t) => t.name.toLowerCase().includes(q)) : base.slice(0, 6);
    return filtered.map((t) => ({ task: t, project: projects.find((p) => p.id === t.projectId) }));
  }, [query, tasks, projects]);

  if (!open) return null;

  const go = (taskId: string) => {
    onClose();
    router.push(`/app/tasks/${taskId}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white animate-fade-in lg:hidden">
      {/* Search header */}
      <div className="glass pt-safe flex items-center gap-2 border-b border-slate-200/70 px-3 pb-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari task…"
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-[15px] text-slate-900 placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/15"
          />
        </div>
        <button
          onClick={onClose}
          className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl text-slate-500 active:bg-slate-100"
          aria-label="Tutup pencarian"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Results */}
      <div className="scrollbar-thin flex-1 overflow-y-auto p-3">
        {!query.trim() && results.length > 0 && (
          <p className="mb-1 flex items-center gap-1.5 px-2 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <Clock className="h-3.5 w-3.5" /> Terbaru
          </p>
        )}
        {results.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Search className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-slate-700">Tidak ada task cocok</p>
            <p className="mt-1 text-xs text-slate-400">Coba kata kunci lain.</p>
          </div>
        ) : (
          <ul className="space-y-1">
            {results.map(({ task, project }) => (
              <li key={task.id}>
                <button
                  onClick={() => go(task.id)}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors active:bg-slate-100"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-base">
                    {project?.icon ?? "📁"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-800">
                      {task.name}
                    </span>
                    <span className="block truncate text-xs text-slate-400">
                      {project?.name} · {formatRelative(task.updatedAt)}
                    </span>
                  </span>
                  <Badge tone={difficultyTone[task.difficulty]}>{difficultyLabel[task.difficulty]}</Badge>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
