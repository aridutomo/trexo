"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, Search, Bell } from "lucide-react";
import { useTrexo } from "@/lib/store";
import { Badge } from "@/components/ui/Badge";
import type { TaskDifficulty } from "@/lib/types";

const difficultyTone: Record<TaskDifficulty, "emerald" | "amber" | "rose"> = {
  easy: "emerald",
  medium: "amber",
  hard: "rose",
};

export function Topbar({
  title,
  onMenuClick,
  onSearchClick,
}: {
  title: string;
  onMenuClick?: () => void;
  onSearchClick?: () => void;
}) {
  return (
    <header className="glass sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-slate-200/70 px-3 sm:px-4 lg:px-6">
      <button
        onClick={onMenuClick}
        className="-ml-1 flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 active:bg-slate-200 lg:hidden"
        aria-label="Buka menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <h1 className="truncate text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
        {title}
      </h1>

      <div className="ml-auto flex items-center gap-1.5">
        {/* Mobile: open search overlay */}
        <button
          onClick={onSearchClick}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 active:bg-slate-200 sm:hidden"
          aria-label="Cari"
        >
          <Search className="h-5 w-5" />
        </button>
        <GlobalSearch />
        <button className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 active:bg-slate-200">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>
      </div>
    </header>
  );
}

function GlobalSearch() {
  const router = useRouter();
  const tasks = useTrexo((s) => s.tasks);
  const projects = useTrexo((s) => s.projects);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return tasks
      .filter((t) => t.name.toLowerCase().includes(q))
      .slice(0, 7)
      .map((t) => ({ task: t, project: projects.find((p) => p.id === t.projectId) }));
  }, [query, tasks, projects]);

  const go = (taskId: string) => {
    setOpen(false);
    setQuery("");
    router.push(`/app/tasks/${taskId}`);
  };

  return (
    <div className="relative hidden sm:block">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          blurTimer.current = setTimeout(() => setOpen(false), 150);
        }}
        placeholder="Cari task…"
        className="h-10 w-56 rounded-xl border border-slate-200 bg-slate-100/70 pl-9 pr-3 text-sm text-slate-800 transition-colors placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/15 lg:w-72"
      />
      {open && query.trim() && (
        <div className="absolute right-0 top-12 z-30 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lift animate-scale-in lg:left-0 lg:w-96">
          {results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-400">
              Tidak ada task cocok “{query}”.
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto p-1.5">
              {results.map(({ task, project }) => (
                <li key={task.id}>
                  <button
                    onMouseDown={() => {
                      if (blurTimer.current) clearTimeout(blurTimer.current);
                      go(task.id);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-slate-100"
                  >
                    <span className="text-base leading-none">{project?.icon ?? "📁"}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-800">
                        {task.name}
                      </span>
                      <span className="block truncate text-xs text-slate-400">
                        {project?.name}
                      </span>
                    </span>
                    <Badge tone={difficultyTone[task.difficulty]} className="hidden sm:inline-flex">
                      {task.difficulty === "easy" ? "Mudah" : task.difficulty === "medium" ? "Medium" : "Susah"}
                    </Badge>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
