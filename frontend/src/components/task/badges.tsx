import { Badge } from "@/components/ui/Badge";
import {
  DIFFICULTY_META,
  SOURCE_META,
  STATUS_META,
  type TaskDifficulty,
  type TaskSource,
  type TaskStatus,
} from "@/lib/types";

const statusTone: Record<TaskStatus, "slate" | "blue" | "amber" | "emerald"> = {
  todo: "slate",
  in_progress: "blue",
  review: "amber",
  done: "emerald",
};

const difficultyTone: Record<TaskDifficulty, "emerald" | "amber" | "rose"> = {
  easy: "emerald",
  medium: "amber",
  hard: "rose",
};

const sourceTone: Record<TaskSource, "sky" | "violet"> = {
  own_idea: "sky",
  user_request: "violet",
};

export function StatusBadge({ status, dot = true }: { status: TaskStatus; dot?: boolean }) {
  return (
    <Badge tone={statusTone[status]} dot={dot}>
      {STATUS_META[status].label}
    </Badge>
  );
}

export function DifficultyBadge({ difficulty }: { difficulty: TaskDifficulty }) {
  return <Badge tone={difficultyTone[difficulty]}>{DIFFICULTY_META[difficulty].label}</Badge>;
}

export function SourceBadge({ source }: { source: TaskSource }) {
  return <Badge tone={sourceTone[source]}>{SOURCE_META[source].label}</Badge>;
}
