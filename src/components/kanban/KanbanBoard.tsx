"use client";

import { useMemo } from "react";
import { DragDropContext, Droppable, type DropResult } from "@hello-pangea/dnd";
import { Plus } from "lucide-react";
import { KanbanCard } from "./KanbanCard";
import { useTrexo } from "@/lib/store";
import { STATUS_META, STATUS_ORDER, type Task, type TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  tasks: Task[];
  onAdd: (status: TaskStatus) => void;
}

export function KanbanBoard({ tasks, onAdd }: Props) {
  const moveTask = useTrexo((s) => s.moveTask);
  const comments = useTrexo((s) => s.comments);

  const byStatus = useMemo(() => {
    const acc: Record<TaskStatus, Task[]> = {
      todo: [],
      in_progress: [],
      review: [],
      done: [],
    };
    tasks.forEach((t) => acc[t.status].push(t));
    return acc;
  }, [tasks]);

  const commentCount = (taskId: string) =>
    comments.filter((c) => c.taskId === taskId).length;

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    const from = source.droppableId as TaskStatus;
    const to = destination.droppableId as TaskStatus;
    if (from === to) return; // urutan dalam kolom tidak disimpan
    // Real-time update status (mensimulasikan PATCH/PUT ke API)
    moveTask(draggableId, to);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUS_ORDER.map((status) => {
          const meta = STATUS_META[status];
          const list = byStatus[status];
          return (
            <Droppable key={status} droppableId={status}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    "flex w-[300px] shrink-0 flex-col rounded-2xl border bg-slate-100/60 transition-colors",
                    snapshot.isDraggingOver ? "border-brand-300 bg-brand-50/60" : "border-slate-200/70"
                  )}
                >
                  {/* Header kolom */}
                  <div className="flex items-center justify-between px-3.5 py-3">
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2.5 w-2.5 rounded-full", meta.dot)} />
                      <span className="text-sm font-semibold text-slate-700">{meta.label}</span>
                      <span className="rounded-md bg-white px-1.5 py-0.5 text-xs font-medium tabular-nums text-slate-500 ring-1 ring-slate-200">
                        {list.length}
                      </span>
                    </div>
                    <button
                      onClick={() => onAdd(status)}
                      className="cursor-pointer rounded-md p-1 text-slate-400 transition-colors hover:bg-white hover:text-brand-600"
                      title={`Tambah task di ${meta.label}`}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Cards */}
                  <div className="scrollbar-thin flex max-h-[calc(100vh-18rem)] flex-1 flex-col gap-2.5 overflow-y-auto px-2.5 pb-2.5">
                    {list.length === 0 && !snapshot.isDraggingOver && (
                      <div className="rounded-xl border border-dashed border-slate-300 py-6 text-center text-xs text-slate-400">
                        Tarik task ke sini
                      </div>
                    )}
                    {list.map((task, index) => (
                      <KanbanCard
                        key={task.id}
                        task={task}
                        index={index}
                        commentCount={commentCount(task.id)}
                      />
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          );
        })}
      </div>
    </DragDropContext>
  );
}
