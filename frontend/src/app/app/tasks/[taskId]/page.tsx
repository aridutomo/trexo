"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Trash2,
  Calendar,
  Clock,
  Info,
  CircleCheck,
} from "lucide-react";
import { useTrexo } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { EmptyState } from "@/components/ui/EmptyState";
import { TaskSteps } from "@/components/task/TaskSteps";
import { CommentSection } from "@/components/task/CommentSection";
import { PriorityBadge } from "@/components/task/badges";
import {
  DIFFICULTY_META,
  PRIORITY_META,
  PRIORITY_ORDER,
  SOURCE_META,
  STATUS_META,
  STATUS_ORDER,
  type TaskDifficulty,
  type TaskPriority,
  type TaskSource,
  type TaskStatus,
} from "@/lib/types";
import { computeProgress, formatDate, formatRelative } from "@/lib/utils";

const statusTone: Record<TaskStatus, "slate" | "blue" | "amber" | "emerald"> = {
  todo: "slate",
  in_progress: "blue",
  review: "amber",
  done: "emerald",
};

export default function TaskDetailPage() {
  const params = useParams<{ taskId: string }>();
  const router = useRouter();
  const taskId = params.taskId;

  const tasks = useTrexo((s) => s.tasks);
  const projects = useTrexo((s) => s.projects);
  const updateTask = useTrexo((s) => s.updateTask);
  const deleteTask = useTrexo((s) => s.deleteTask);
  const loadComments = useTrexo((s) => s.loadComments);

  const task = tasks.find((t) => t.id === taskId);
  const project = task ? projects.find((p) => p.id === task.projectId) : undefined;

  const [name, setName] = useState(task?.name ?? "");
  const [desc, setDesc] = useState(task?.description ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setName(task?.name ?? "");
    setDesc(task?.description ?? "");
  }, [task?.id, task?.name, task?.description]);

  // Comments are loaded per-task (not in bootstrap).
  useEffect(() => {
    if (taskId) void loadComments(taskId);
  }, [taskId, loadComments]);

  if (!task) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <EmptyState
          icon={<Info className="h-6 w-6" />}
          title="Task tidak ditemukan"
          description="Task mungkin telah dihapus."
          action={<Link href="/app/dashboard"><Button variant="outline">Kembali</Button></Link>}
        />
      </div>
    );
  }

  const progress = computeProgress(task);
  const stepsDone = task.steps.filter((s) => s.completed).length;

  const commitName = () => {
    const v = name.trim();
    if (v && v !== task.name) updateTask(task.id, { name: v });
    else setName(task.name);
  };
  const commitDesc = () => {
    if (desc !== task.description) updateTask(task.id, { description: desc });
  };

  const handleDelete = async () => {
    try {
      await deleteTask(task.id);
      router.push(project ? `/app/projects/${project.id}` : "/app/dashboard");
    } catch (e) {
      console.error("[trexo] deleteTask failed:", e);
    }
  };

  const dueValue = task.dueDate ? task.dueDate.slice(0, 10) : "";

  return (
    <div className="mx-auto max-w-6xl p-4 lg:p-8">
      {/* Breadcrumb + actions */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={project ? `/app/projects/${project.id}` : "/app/dashboard"}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {project ? project.name : "Dashboard"}
        </Link>
        <div className="flex items-center gap-2">
          <Badge tone={statusTone[task.status]} dot>{STATUS_META[task.status].label}</Badge>
          <Button variant="outline" size="sm" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Hapus</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-5 lg:col-span-2">
          {/* Title + description */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="mb-3 flex flex-wrap items-center gap-1.5">
              <Badge tone={task.difficulty === "easy" ? "emerald" : task.difficulty === "medium" ? "amber" : "rose"}>
                {DIFFICULTY_META[task.difficulty].label}
              </Badge>
              <PriorityBadge priority={task.priority} />
              <Badge tone={task.source === "own_idea" ? "sky" : "violet"}>
                {SOURCE_META[task.source].label}
              </Badge>
            </div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
              className="font-display w-full rounded-xl border border-transparent bg-transparent px-2 py-1 text-2xl font-bold tracking-tight text-foreground outline-none transition-colors hover:bg-muted focus:border-brand-300 focus:bg-card focus:ring-4 focus:ring-brand-500/15"
            />
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              onBlur={commitDesc}
              rows={6}
              placeholder="Tambahkan deskripsi…"
              className="mt-2 w-full resize-y rounded-xl border border-transparent bg-transparent px-2 py-1 text-sm text-muted-foreground outline-none transition-colors placeholder:text-muted-foreground/70 hover:bg-muted focus:border-brand-300 focus:bg-card focus:ring-4 focus:ring-brand-500/15"
            />
          </div>

          <TaskSteps task={task} />
          <CommentSection taskId={task.id} />
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Progress */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Progress</h3>
              <span className="text-2xl font-bold tabular-nums text-brand-600 dark:text-brand-400">{progress}%</span>
            </div>
            <div className="mt-3">
              <Progress value={progress} />
            </div>
            <div className="mt-3 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
              {task.steps.length > 0 ? (
                <span>
                  Dihitung otomatis:{" "}
                  <span className="font-medium text-foreground">
                    {stepsDone} / {task.steps.length} steps selesai
                  </span>
                </span>
              ) : (
                <span>
                  Tanpa steps — progress mengikuti status{" "}
                  <span className="font-medium text-foreground">{STATUS_META[task.status].label}</span>.
                </span>
              )}
            </div>
          </div>

          {/* Properties */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Properti</h3>
            <div className="space-y-4">
              <Select
                label="Status"
                value={task.status}
                onChange={(e) => updateTask(task.id, { status: e.target.value as TaskStatus })}
                options={STATUS_ORDER.map((s) => ({ value: s, label: STATUS_META[s].label }))}
              />
              <Select
                label="Kesulitan"
                value={task.difficulty}
                onChange={(e) => updateTask(task.id, { difficulty: e.target.value as TaskDifficulty })}
                options={[
                  { value: "easy", label: "Mudah" },
                  { value: "medium", label: "Medium" },
                  { value: "hard", label: "Susah" },
                ]}
              />
              <Select
                label="Prioritas"
                value={task.priority}
                onChange={(e) => updateTask(task.id, { priority: e.target.value as TaskPriority })}
                options={PRIORITY_ORDER.map((p) => ({ value: p, label: PRIORITY_META[p].label }))}
              />
              <Select
                label="Sumber Ide"
                value={task.source}
                onChange={(e) => updateTask(task.id, { source: e.target.value as TaskSource })}
                options={[
                  { value: "own_idea", label: "Ide Sendiri" },
                  { value: "user_request", label: "Permintaan User" },
                ]}
              />
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  Jatuh Tempo
                </label>
                <input
                  type="date"
                  value={dueValue}
                  onChange={(e) =>
                    updateTask(task.id, {
                      dueDate: e.target.value
                        ? new Date(e.target.value + "T23:59:00").toISOString()
                        : undefined,
                    })
                  }
                  className="h-10 w-full cursor-pointer rounded-xl border border-input bg-card px-3 text-sm text-foreground transition-colors [color-scheme:light] focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/15 dark:[color-scheme:dark]"
                />
              </div>
            </div>
          </div>

          {/* Meta */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Detail</h3>
            <dl className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" /> Dibuat
                </dt>
                <dd className="font-medium text-foreground">{formatDate(task.createdAt, "d MMM yyyy")}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  <CircleCheck className="h-3.5 w-3.5" /> Diperbarui
                </dt>
                <dd className="font-medium text-foreground">{formatRelative(task.updatedAt)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Hapus task ini?"
        description={`“${task.name}” beserta semua steps dan komentar akan dihapus permanen.`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
              Hapus
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">Tindakan ini tidak dapat dibatalkan.</p>
      </Modal>
    </div>
  );
}
