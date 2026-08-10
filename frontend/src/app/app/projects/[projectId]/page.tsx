"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Plus, List, Columns3, ArrowLeft, FolderKanban } from "lucide-react";
import { useTrexo } from "@/lib/store";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { TaskListView } from "@/components/task/TaskListView";
import { AddTaskModal } from "@/components/task/AddTaskModal";
import { STATUS_META, STATUS_ORDER, type TaskStatus } from "@/lib/types";

const statusTone: Record<TaskStatus, "slate" | "blue" | "amber" | "emerald"> = {
  todo: "slate",
  in_progress: "blue",
  review: "amber",
  done: "emerald",
};

type View = "kanban" | "list";

export default function ProjectPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;

  const projects = useTrexo((s) => s.projects);
  const tasks = useTrexo((s) => s.tasks);
  const setActiveProject = useTrexo((s) => s.setActiveProject);

  const project = projects.find((p) => p.id === projectId);
  const projectTasks = useMemo(
    () => tasks.filter((t) => t.projectId === projectId),
    [tasks, projectId]
  );

  const [view, setView] = useState<View>("kanban");
  const [modalOpen, setModalOpen] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>("todo");

  if (!project) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <EmptyState
          icon={<FolderKanban className="h-6 w-6" />}
          title="Project tidak ditemukan"
          description="Project mungkin telah dihapus atau Anda belum memiliki akses."
          action={
            <Link href="/app/dashboard">
              <Button variant="outline">Kembali ke Dashboard</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const openAdd = (status: TaskStatus = "todo") => {
    setDefaultStatus(status);
    setActiveProject(project.id);
    setModalOpen(true);
  };

  const statusCounts = STATUS_ORDER.reduce(
    (acc, s) => ({ ...acc, [s]: projectTasks.filter((t) => t.status === s).length }),
    {} as Record<TaskStatus, number>
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-4 py-5 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/app/dashboard"
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Link>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <span
                className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
                style={{ backgroundColor: `${project.color}1a` }}
              >
                {project.icon}
              </span>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  {project.name}
                </h2>
                {project.description && (
                  <p className="mt-0.5 max-w-xl text-sm text-slate-500">{project.description}</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {STATUS_ORDER.map((s) => (
                    <Badge key={s} tone={statusTone[s]} dot>
                      {statusCounts[s]} {STATUS_META[s].label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <SegmentedControl
                value={view}
                onChange={setView}
                options={[
                  { value: "kanban", label: <><Columns3 className="h-4 w-4" /> Kanban</> },
                  { value: "list", label: <><List className="h-4 w-4" /> List</> },
                ]}
              />
              <Button onClick={() => openAdd()}>
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Task</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden p-4 lg:p-6">
        <div className="mx-auto h-full max-w-7xl">
          {projectTasks.length === 0 ? (
            <EmptyState
              icon={<FolderKanban className="h-6 w-6" />}
              title="Project ini masih kosong"
              description="Tambahkan task pertama untuk mulai mengelola pekerjaan di project ini."
              action={<Button onClick={() => openAdd()}><Plus className="h-4 w-4" /> Buat Task</Button>}
            />
          ) : view === "kanban" ? (
            <KanbanBoard tasks={projectTasks} onAdd={openAdd} />
          ) : (
            <TaskListView tasks={projectTasks} onAdd={() => openAdd()} />
          )}
        </div>
      </div>

      <AddTaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        projectId={project.id}
        defaultStatus={defaultStatus}
      />
    </div>
  );
}
