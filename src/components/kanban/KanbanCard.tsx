"use client";

import { Draggable } from "@hello-pangea/dnd";
import type { DraggableProvided, DraggableStateSnapshot } from "@hello-pangea/dnd";
import { useRouter } from "next/navigation";
import { CalendarClock, MessageSquare, GripVertical } from "lucide-react";
import { DifficultyBadge, SourceBadge } from "@/components/task/badges";
import { Progress } from "@/components/ui/Progress";
import { computeProgress, formatDate, cn, isOverdue } from "@/lib/utils";
import type { Task } from "@/lib/types";

interface Props {
  task: Task;
  index: number;
  commentCount: number;
}

export function KanbanCard({ task, index, commentCount }: Props) {
  const router = useRouter();
  const progress = computeProgress(task);
  const stepsDone = task.steps.filter((s) => s.completed).length;
  const hasSteps = task.steps.length > 0;
  const overdue = isOverdue(task);

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => !snapshot.isDragging && router.push(`/app/tasks/${task.id}`)}
          style={provided.draggableProps.style}
          className={cn(
            "group cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift active:translate-y-0",
            snapshot.isDragging && "rotate-1 border-brand-300 shadow-lift"
          )}
        >
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <DifficultyBadge difficulty={task.difficulty} />
              <SourceBadge source={task.source} />
            </div>
            <GripVertical className="h-4 w-4 shrink-0 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>

          <h4 className="text-sm font-semibold leading-snug text-slate-900">{task.name}</h4>
          {task.description && (
            <p className="mt-1 line-clamp-2 text-xs text-slate-500">{task.description}</p>
          )}

          {/* Progress */}
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-[11px] text-slate-400">
              <span>Progress</span>
              <span className="tabular-nums">
                {hasSteps ? `${stepsDone}/${task.steps.length} steps` : "tanpa steps"}
              </span>
            </div>
            <Progress value={progress} size="sm" />
          </div>

          {/* Footer */}
          <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
            {task.dueDate && (
              <span className={cn("inline-flex items-center gap-1", overdue && "font-medium text-rose-500")}>
                <CalendarClock className="h-3.5 w-3.5" />
                {formatDate(task.dueDate, "d MMM")}
              </span>
            )}
            {commentCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />
                {commentCount}
              </span>
            )}
            <span className="ml-auto tabular-nums font-medium text-slate-500">{progress}%</span>
          </div>
        </div>
      )}
    </Draggable>
  );
}
