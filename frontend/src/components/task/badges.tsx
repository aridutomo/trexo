import { Badge } from "@/components/ui/Badge";
import {
  DIFFICULTY_META,
  PRIORITY_META,
  SOURCE_META,
  STATUS_META,
  type TaskDifficulty,
  type TaskPriority,
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

const priorityTone: Record<TaskPriority, "blue" | "amber" | "orange" | "rose"> = {
  low: "blue",
  medium: "amber",
  high: "orange",
  urgent: "rose",
};

const sourceTone: Record<TaskSource, "sky" | "violet"> = {
  own_idea: "sky",
  user_request: "violet",
};

// An enum value from the backend may be absent or unrecognized when the schema
// lags the frontend (e.g. the priority column not yet migrated, or stale data).
// Return the key only when it actually exists in the lookup map, else a safe
// default — so one bad record can never crash the whole board.
function resolveKey<K extends string>(map: Record<K, unknown>, key: string | undefined, fallback: NoInfer<K>): K {
  return key != null && key in map ? (key as K) : fallback;
}

export function StatusBadge({ status, dot = true }: { status?: TaskStatus; dot?: boolean }) {
  const s = resolveKey(STATUS_META, status, "todo");
  return (
    <Badge tone={statusTone[s]} dot={dot}>
      {STATUS_META[s].label}
    </Badge>
  );
}

export function DifficultyBadge({ difficulty }: { difficulty?: TaskDifficulty }) {
  const d = resolveKey(DIFFICULTY_META, difficulty, "medium");
  return <Badge tone={difficultyTone[d]}>{DIFFICULTY_META[d].label}</Badge>;
}

export function PriorityBadge({ priority }: { priority?: TaskPriority }) {
  const p = resolveKey(PRIORITY_META, priority, "medium");
  return <Badge tone={priorityTone[p]} dot={p === "urgent"}>{PRIORITY_META[p].label}</Badge>;
}

export function SourceBadge({ source }: { source?: TaskSource }) {
  const src = resolveKey(SOURCE_META, source, "own_idea");
  return <Badge tone={sourceTone[src]}>{SOURCE_META[src].label}</Badge>;
}
