"use client";

import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Search,
  LayoutDashboard,
  BarChart3,
  Settings,
  Sun,
  Moon,
  type LucideProps,
} from "lucide-react";
import { useTrexo } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Project } from "@/lib/types";

type CmdItem = {
  type: "cmd";
  id: string;
  label: string;
  icon: ComponentType<LucideProps>;
  hint: string;
  run: () => void;
};
type TaskItem = { type: "task"; id: string; name: string; project?: Project };
type FlatItem = CmdItem | TaskItem;

interface Props {
  open: boolean;
  onClose: () => void;
}

/** Centered ⌘K command palette: navigate, toggle theme, or jump to a task. */
export function CommandPalette({ open, onClose }: Props) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const tasks = useTrexo((s) => s.tasks);
  const projects = useTrexo((s) => s.projects);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const commands = useMemo<CmdItem[]>(
    () => [
      {
        type: "cmd",
        id: "nav-dash",
        label: "Buka Dashboard",
        icon: LayoutDashboard,
        hint: "Navigasi",
        run: () => router.push("/app/dashboard"),
      },
      {
        type: "cmd",
        id: "nav-report",
        label: "Buka Report",
        icon: BarChart3,
        hint: "Navigasi",
        run: () => router.push("/app/report"),
      },
      {
        type: "cmd",
        id: "nav-settings",
        label: "Buka Pengaturan",
        icon: Settings,
        hint: "Navigasi",
        run: () => router.push("/app/settings"),
      },
      {
        type: "cmd",
        id: "theme",
        label: resolvedTheme === "dark" ? "Ganti ke mode terang" : "Ganti ke mode gelap",
        icon: resolvedTheme === "dark" ? Sun : Moon,
        hint: "Tema",
        run: () => setTheme(resolvedTheme === "dark" ? "light" : "dark"),
      },
    ],
    [router, resolvedTheme, setTheme]
  );

  const filteredCmds = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => c.label.toLowerCase().includes(q));
  }, [query, commands]);

  const taskResults = useMemo<TaskItem[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return tasks
      .filter((t) => t.name.toLowerCase().includes(q))
      .slice(0, 6)
      .map((t) => ({ type: "task", id: t.id, name: t.name, project: projects.find((p) => p.id === t.projectId) }));
  }, [query, tasks, projects]);

  const flat = useMemo<FlatItem[]>(
    () => [...filteredCmds, ...taskResults],
    [filteredCmds, taskResults]
  );

  // Reset + focus + scroll lock + Esc on open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    setQuery("");
    setActive(0);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useEffect(() => setActive(0), [query]);

  // Keep the active row in view
  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open || typeof document === "undefined") return null;

  const runItem = (item: FlatItem) => {
    if (item.type === "cmd") item.run();
    else router.push(`/app/tasks/${item.id}`);
    onClose();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flat[active]) runItem(flat[active]);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]">
      <div
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm animate-fade-in dark:bg-black/70"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-lift animate-scale-in">
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Cari task atau perintah…"
            className="h-14 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden shrink-0 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:block">
            ESC
          </kbd>
        </div>

        <div ref={listRef} className="scrollbar-thin max-h-[50vh] overflow-y-auto p-2">
          {flat.length === 0 && (
            <p className="px-3 py-10 text-center text-sm text-muted-foreground">Tidak ada hasil untuk “{query}”.</p>
          )}
          {filteredCmds.length > 0 && <SectionLabel>Perintah</SectionLabel>}
          {flat.map((item, i) => {
            const isActive = i === active;
            return (
              <button
                key={item.type + item.id}
                data-idx={i}
                onMouseEnter={() => setActive(i)}
                onClick={() => runItem(item)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                  isActive ? "bg-muted text-foreground" : "text-foreground"
                )}
              >
                {item.type === "cmd" ? (
                  <item.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <span className="shrink-0 text-base">{item.project?.icon ?? "📁"}</span>
                )}
                <span className="min-w-0 flex-1 truncate">{item.type === "cmd" ? item.label : item.name}</span>
                {item.type === "task" && item.project ? (
                  <span className="shrink-0 text-xs text-muted-foreground">{item.project.name}</span>
                ) : item.type === "cmd" ? (
                  <span className="shrink-0 text-xs text-muted-foreground">{item.hint}</span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4 border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
          <span>↑↓ navigasi</span>
          <span>↵ pilih</span>
          <span>esc tutup</span>
        </div>
      </div>
    </div>,
    document.body
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{children}</p>;
}
