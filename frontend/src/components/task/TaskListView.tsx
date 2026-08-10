"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Inbox } from "lucide-react";
import { DifficultyBadge, SourceBadge, StatusBadge } from "@/components/task/badges";
import { Progress } from "@/components/ui/Progress";
import { EmptyState } from "@/components/ui/EmptyState";
import { computeProgress, formatDate, cn, isOverdue } from "@/lib/utils";
import { STATUS_META, type Task, type TaskStatus } from "@/lib/types";

type SortKey = "name" | "difficulty" | "status" | "progress" | "dueDate";

interface Props {
  tasks: Task[];
  onAdd?: () => void;
}

export function TaskListView({ tasks, onAdd }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "status",
    dir: "asc",
  });

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = tasks.filter(
      (t) =>
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
    );

    const dirMul = sort.dir === "asc" ? 1 : -1;
    const diffValue = { easy: 1, medium: 2, hard: 3 } as const;

    list = [...list].sort((a, b) => {
      switch (sort.key) {
        case "name":
          return a.name.localeCompare(b.name) * dirMul;
        case "difficulty":
          return (diffValue[a.difficulty] - diffValue[b.difficulty]) * dirMul;
        case "status":
          return (STATUS_META[a.status].order - STATUS_META[b.status].order) * dirMul;
        case "progress":
          return (computeProgress(a) - computeProgress(b)) * dirMul;
        case "dueDate": {
          const av = a.dueDate ? +new Date(a.dueDate) : Infinity;
          const bv = b.dueDate ? +new Date(b.dueDate) : Infinity;
          return (av - bv) * dirMul;
        }
        default:
          return 0;
      }
    });
    return list;
  }, [tasks, search, sort]);

  const toggleSort = (key: SortKey) =>
    setSort((s) =>
      s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sort.key !== k) return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />;
    return sort.dir === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
    );
  };

  const Th = ({ k, children, className }: { k: SortKey; children: React.ReactNode; className?: string }) => (
    <th className={cn("px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground", className)}>
      <button
        onClick={() => toggleSort(k)}
        className="inline-flex items-center gap-1.5 hover:text-foreground"
      >
        {children}
        <SortIcon k={k} />
      </button>
    </th>
  );

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={<Inbox className="h-6 w-6" />}
        title="Belum ada task"
        description="Buat task pertama untuk project ini."
        action={onAdd ? undefined : undefined}
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari task…"
          className="h-10 w-full rounded-xl border border-input bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={<Search className="h-6 w-6" />} title="Tidak ditemukan" description={`Tidak ada task cocok dengan “${search}”.`} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <Th k="name">Nama Task</Th>
                  <Th k="difficulty">Kesulitan</Th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Sumber Ide
                  </th>
                  <Th k="progress">Progress</Th>
                  <Th k="status">Status</Th>
                  <Th k="dueDate">Jatuh Tempo</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((t) => {
                  const progress = computeProgress(t);
                  const done = t.steps.filter((s) => s.completed).length;
                  const overdue = isOverdue(t);
                  return (
                    <tr
                      key={t.id}
                      onClick={() => router.push(`/app/tasks/${t.id}`)}
                      className="cursor-pointer transition-colors hover:bg-muted"
                    >
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-foreground">{t.name}</div>
                        {t.steps.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {done}/{t.steps.length} steps
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <DifficultyBadge difficulty={t.difficulty} />
                      </td>
                      <td className="px-4 py-3">
                        <SourceBadge source={t.source} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Progress value={progress} size="sm" className="w-24" />
                          <span className="w-9 text-xs font-medium tabular-nums text-muted-foreground">
                            {progress}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {t.dueDate ? (
                          <span className={cn(overdue && "font-medium text-rose-500 dark:text-rose-400")}>
                            {formatDate(t.dueDate, "d MMM yyyy")}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
