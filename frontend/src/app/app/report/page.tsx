"use client";

import { useMemo, useState } from "react";
import { FileSpreadsheet, Printer, Filter, RotateCcw, BarChart3 } from "lucide-react";
import { useTrexo } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusDoughnut } from "@/components/dashboard/StatusDoughnut";
import { DifficultyBar } from "@/components/dashboard/DifficultyBar";
import { DifficultyBadge, SourceBadge, StatusBadge } from "@/components/task/badges";
import { Progress } from "@/components/ui/Progress";
import { exportTasksToExcel, buildSummary } from "@/lib/export";
import { type TaskDifficulty, type TaskSource, type TaskStatus } from "@/lib/types";
import { computeProgress, formatDate } from "@/lib/utils";

type AnyFilter = "all";

export default function ReportPage() {
  const tasks = useTrexo((s) => s.tasks);
  const projects = useTrexo((s) => s.projects);
  const workspaces = useTrexo((s) => s.workspaces);
  const activeWorkspaceId = useTrexo((s) => s.activeWorkspaceId);

  const [projectId, setProjectId] = useState<string>("all");
  const [status, setStatus] = useState<TaskStatus | AnyFilter>("all");
  const [difficulty, setDifficulty] = useState<TaskDifficulty | AnyFilter>("all");
  const [source, setSource] = useState<TaskSource | AnyFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const wsProjects = projects.filter((p) => p.workspaceId === activeWorkspaceId);

  const projectOptions = [
    { value: "all", label: "Semua Project" },
    ...wsProjects.map((p) => ({ value: p.id, label: `${p.icon} ${p.name}` })),
  ];

  const filtered = useMemo(() => {
    const wsProjectIds = new Set(wsProjects.map((p) => p.id));
    const from = dateFrom ? +new Date(dateFrom) : null;
    const to = dateTo ? +new Date(dateTo + "T23:59:59") : null;
    return tasks.filter((t) => {
      if (!wsProjectIds.has(t.projectId)) return false;
      if (projectId !== "all" && t.projectId !== projectId) return false;
      if (status !== "all" && t.status !== status) return false;
      if (difficulty !== "all" && t.difficulty !== difficulty) return false;
      if (source !== "all" && t.source !== source) return false;
      const created = +new Date(t.createdAt);
      if (from && created < from) return false;
      if (to && created > to) return false;
      return true;
    });
  }, [tasks, wsProjects, projectId, status, difficulty, source, dateFrom, dateTo]);

  const summary = useMemo(() => buildSummary(filtered), [filtered]);

  const reset = () => {
    setProjectId("all");
    setStatus("all");
    setDifficulty("all");
    setSource("all");
    setDateFrom("");
    setDateTo("");
  };

  const wsName = workspaces.find((w) => w.id === activeWorkspaceId)?.name ?? "Workspace";
  const projectName = projectId === "all" ? wsName : wsProjects.find((p) => p.id === projectId)?.name ?? "";

  const handleExport = () => {
    exportTasksToExcel({ tasks: filtered, projectName });
  };

  const hasFilters =
    projectId !== "all" || status !== "all" || difficulty !== "all" || source !== "all" || dateFrom || dateTo;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Report</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Rekapitulasi task di workspace <span className="font-medium text-foreground">{wsName}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Cetak / PDF</span>
          </Button>
          <Button onClick={handleExport} disabled={filtered.length === 0}>
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Filter</span>
          {hasFilters && (
            <button
              onClick={reset}
              className="ml-auto inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          )}
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <Select
              label="Project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              options={projectOptions}
            />
            <Select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus | AnyFilter)}
              options={[
                { value: "all", label: "Semua" },
                { value: "todo", label: "To Do" },
                { value: "in_progress", label: "In Progress" },
                { value: "review", label: "Review" },
                { value: "done", label: "Done" },
              ]}
            />
            <Select
              label="Kesulitan"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as TaskDifficulty | AnyFilter)}
              options={[
                { value: "all", label: "Semua" },
                { value: "easy", label: "Mudah" },
                { value: "medium", label: "Medium" },
                { value: "hard", label: "Susah" },
              ]}
            />
            <Select
              label="Sumber Ide"
              value={source}
              onChange={(e) => setSource(e.target.value as TaskSource | AnyFilter)}
              options={[
                { value: "all", label: "Semua" },
                { value: "own_idea", label: "Ide Sendiri" },
                { value: "user_request", label: "Permintaan User" },
              ]}
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Dari Tanggal</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-10 w-full cursor-pointer rounded-xl border border-input bg-card px-3 text-sm text-foreground transition-colors [color-scheme:light] focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/15 dark:[color-scheme:dark]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Sampai Tanggal</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-10 w-full cursor-pointer rounded-xl border border-input bg-card px-3 text-sm text-foreground transition-colors [color-scheme:light] focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/15 dark:[color-scheme:dark]"
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<BarChart3 className="h-6 w-6" />}
          title="Tidak ada data"
          description="Tidak ada task yang cocok dengan filter yang dipilih."
        />
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard label="Total Task" value={summary.total} icon={<BarChart3 className="h-5 w-5" />} tone="brand" />
            <StatCard label="Selesai" value={summary.doneCount} hint={`${Math.round((summary.doneCount / summary.total) * 100)}% selesai`} icon={<BarChart3 className="h-5 w-5" />} tone="emerald" />
            <StatCard label="Dalam Proses" value={summary.byStatus.in_progress + summary.byStatus.review} icon={<BarChart3 className="h-5 w-5" />} tone="amber" />
            <StatCard label="Progress Rata-rata" value={`${summary.overallProgress}%`} icon={<BarChart3 className="h-5 w-5" />} tone="sky" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <StatusDoughnut counts={summary.byStatus} />
            <DifficultyBar counts={summary.byDifficulty} />
          </div>

          {/* HTML preview table */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Preview Rekapitulasi</h3>
                <p className="text-xs text-muted-foreground">{filtered.length} task · {projectName}</p>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50 text-left">
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Task</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Kesulitan</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sumber</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Progress</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Jatuh Tempo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((t) => {
                      const p = wsProjects.find((pr) => pr.id === t.projectId);
                      return (
                        <tr key={t.id} className="transition-colors hover:bg-muted">
                          <td className="px-4 py-3">
                            <div className="font-medium text-foreground">{t.name}</div>
                            <div className="text-xs text-muted-foreground">{p?.icon} {p?.name}</div>
                          </td>
                          <td className="px-4 py-3"><StatusBadge status={t.status} dot={false} /></td>
                          <td className="px-4 py-3"><DifficultyBadge difficulty={t.difficulty} /></td>
                          <td className="px-4 py-3"><SourceBadge source={t.source} /></td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Progress value={computeProgress(t)} size="sm" className="w-20" />
                              <span className="text-xs tabular-nums text-muted-foreground">{computeProgress(t)}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {t.dueDate ? formatDate(t.dueDate, "d MMM yyyy") : <span className="text-muted-foreground/50">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
