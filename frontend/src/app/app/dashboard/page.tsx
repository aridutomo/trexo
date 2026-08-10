"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  ClipboardList,
  CircleDashed,
  CheckCircle2,
  TrendingUp,
  CalendarClock,
  ArrowRight,
} from "lucide-react";
import { useTrexo } from "@/lib/store";
import { computeProgress, formatDate, formatRelative, isOverdue } from "@/lib/utils";
import { STATUS_ORDER } from "@/lib/types";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusDoughnut } from "@/components/dashboard/StatusDoughnut";
import { DifficultyBar } from "@/components/dashboard/DifficultyBar";
import { StatusBadge, DifficultyBadge } from "@/components/task/badges";
import { Progress } from "@/components/ui/Progress";
import { EmptyState } from "@/components/ui/EmptyState";
import type { TaskDifficulty, TaskStatus } from "@/lib/types";

export default function DashboardPage() {
  const user = useTrexo((s) => s.user);
  const tasks = useTrexo((s) => s.tasks);
  const projects = useTrexo((s) => s.projects);
  const workspaces = useTrexo((s) => s.workspaces);
  const activeWorkspaceId = useTrexo((s) => s.activeWorkspaceId);

  // Scope ke workspace aktif
  const wsProjectIds = useMemo(
    () => new Set(projects.filter((p) => p.workspaceId === activeWorkspaceId).map((p) => p.id)),
    [projects, activeWorkspaceId]
  );
  const wsTasks = useMemo(
    () => tasks.filter((t) => wsProjectIds.has(t.projectId)),
    [tasks, wsProjectIds]
  );

  const byStatus = useMemo(() => {
    const acc: Record<TaskStatus, number> = { todo: 0, in_progress: 0, review: 0, done: 0 };
    wsTasks.forEach((t) => (acc[t.status] += 1));
    return acc;
  }, [wsTasks]);

  const byDifficulty = useMemo(() => {
    const acc: Record<TaskDifficulty, number> = { easy: 0, medium: 0, hard: 0 };
    wsTasks.forEach((t) => (acc[t.difficulty] += 1));
    return acc;
  }, [wsTasks]);

  const overallProgress =
    wsTasks.length === 0
      ? 0
      : Math.round(wsTasks.reduce((a, t) => a + computeProgress(t), 0) / wsTasks.length);

  const pending = byStatus.todo + byStatus.in_progress + byStatus.review;

  const recent = useMemo(
    () =>
      [...wsTasks]
        .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
        .slice(0, 5),
    [wsTasks]
  );

  const dueSoon = useMemo(
    () =>
      wsTasks
        .filter((t) => t.dueDate && t.status !== "done")
        .sort((a, b) => +new Date(a.dueDate!) - +new Date(b.dueDate!))
        .slice(0, 5),
    [wsTasks]
  );

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const firstName = user?.name?.split(" ")[0] ?? "Kawan";
  const todayLabel = formatDate(new Date(), "EEEE, d MMMM yyyy");

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 lg:p-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Halo, {firstName} 👋
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {todayLabel} · Workspace <span className="font-medium text-slate-700">{activeWorkspace?.name}</span>
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Task"
          value={wsTasks.length}
          hint={`${projects.filter((p) => p.workspaceId === activeWorkspaceId).length} project`}
          icon={<ClipboardList className="h-5 w-5" />}
          tone="brand"
        />
        <StatCard
          label="Sedang Berjalan"
          value={pending}
          hint={`${byStatus.in_progress} dalam pengerjaan`}
          icon={<CircleDashed className="h-5 w-5" />}
          tone="amber"
        />
        <StatCard
          label="Selesai"
          value={byStatus.done}
          hint={`${wsTasks.length ? Math.round((byStatus.done / wsTasks.length) * 100) : 0}% dari total`}
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="emerald"
        />
        <StatCard
          label="Progress Keseluruhan"
          value={`${overallProgress}%`}
          hint="Rata-rata semua task"
          icon={<TrendingUp className="h-5 w-5" />}
          tone="sky"
        />
      </div>

      {/* Progress overall bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Progress Workspace</h3>
            <p className="text-xs text-slate-400">
              Gabungan progress seluruh task di {activeWorkspace?.name}
            </p>
          </div>
          <span className="font-display text-3xl font-bold tabular-nums text-brand-600">{overallProgress}%</span>
        </div>
        <Progress value={overallProgress} size="md" />
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
          {STATUS_ORDER.map((s) => (
            <div key={s} className="rounded-xl bg-slate-100/60 px-3 py-2.5 text-center">
              <div className="font-display text-lg font-bold tabular-nums text-slate-900">{byStatus[s]}</div>
              <div className="text-xs capitalize text-slate-500">
                {s === "in_progress" ? "Progress" : s === "todo" ? "To Do" : s}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <StatusDoughnut counts={byStatus} />
        <DifficultyBar counts={byDifficulty} />
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Recent */}
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h3 className="text-sm font-semibold text-slate-900">Task Terbaru</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {recent.length === 0 ? (
              <EmptyState className="m-4 border-0" icon={<ClipboardList className="h-5 w-5" />} title="Belum ada task" />
            ) : (
              recent.map((t) => {
                const project = projects.find((p) => p.id === t.projectId);
                return (
                  <Link
                    key={t.id}
                    href={`/app/tasks/${t.id}`}
                    className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50"
                  >
                    <span className="text-base">{project?.icon ?? "📁"}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">{t.name}</p>
                      <p className="text-xs text-slate-400">{project?.name} · {formatRelative(t.updatedAt)}</p>
                    </div>
                    <StatusBadge status={t.status} dot={false} />
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Due soon */}
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <CalendarClock className="h-4 w-4 text-slate-400" />
              Jatuh Tempo Terdekat
            </h3>
          </div>
          <div className="divide-y divide-slate-50">
            {dueSoon.length === 0 ? (
              <EmptyState className="m-4 border-0" icon={<CalendarClock className="h-5 w-5" />} title="Tidak ada tenggat" description="Semua task tanpa jatuh tempo." />
            ) : (
              dueSoon.map((t) => {
                const project = projects.find((p) => p.id === t.projectId);
                const overdue = isOverdue(t);
                return (
                  <Link
                    key={t.id}
                    href={`/app/tasks/${t.id}`}
                    className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50"
                  >
                    <span className={`flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg text-center ${overdue ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-600"}`}>
                      <CalendarClock className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">{t.name}</p>
                      <p className={`text-xs ${overdue ? "font-medium text-rose-500" : "text-slate-400"}`}>
                        {project?.name} · {overdue ? "Terlambat · " : ""}{formatDate(t.dueDate!, "d MMM")}
                      </p>
                    </div>
                    <DifficultyBadge difficulty={t.difficulty} />
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-center pb-2">
        <Link
          href="/app/report"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          Lihat report lengkap
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
