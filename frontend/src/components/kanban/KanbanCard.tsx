"use client";

import { Draggable } from "@hello-pangea/dnd";
import type { DraggableProvided, DraggableStateSnapshot } from "@hello-pangea/dnd";
import { useRouter } from "next/navigation";
import { CalendarClock, MessageSquare, GripVertical } from "lucide-react";
import { DifficultyBadge, PriorityBadge, SourceBadge } from "@/components/task/badges";
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
          onClick={() => {
            if (!snapshot.isDragging) router.push(`/app/tasks/${task.id}`);
          }}
          style={provided.draggableProps.style}
          className={cn(
            "group cursor-pointer rounded-2xl border border-border bg-card p-3.5 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift active:translate-y-0 dark:hover:border-brand-500/40",
            snapshot.isDragging && "rotate-1 border-brand-300 shadow-lift dark:border-brand-500/50"
          )}
        >
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <DifficultyBadge difficulty={task.difficulty} />
              <PriorityBadge priority={task.priority} />
              <SourceBadge source={task.source} />
            </div>
            <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </div>

          <h4 className="text-sm font-semibold leading-snug text-foreground">{task.name}</h4>
          {task.description && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{task.description}</p>
          )}

          {/* Progress */}
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Progress</span>
              <span className="tabular-nums">
                {hasSteps ? `${stepsDone}/${task.steps.length} steps` : "tanpa steps"}
              </span>
            </div>
            <Progress value={progress} size="sm" />
          </div>

          {/* Footer */}
          <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
            {task.dueDate && (
              <span className={cn("inline-flex items-center gap-1", overdue && "font-medium text-rose-500 dark:text-rose-400")}>
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
            <span className="ml-auto tabular-nums font-medium text-muted-foreground">{progress}%</span>
          </div>
        </div>
      )}
    </Draggable>
  );
}
