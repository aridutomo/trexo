import { cn, clampPercent } from "@/lib/utils";

export interface ProgressProps {
  value: number; // 0-100
  className?: string;
  barClassName?: string;
  size?: "sm" | "md";
  showLabel?: boolean;
}

const colorForValue = (value: number) => {
  if (value >= 100) return "bg-emerald-500";
  if (value >= 50) return "bg-brand-500";
  if (value > 0) return "bg-amber-500";
  return "bg-slate-300";
};

export function Progress({
  value,
  className,
  barClassName,
  size = "md",
  showLabel,
}: ProgressProps) {
  const pct = clampPercent(value);
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "w-full overflow-hidden rounded-full bg-slate-100",
          size === "sm" ? "h-1.5" : "h-2"
        )}
      >
        <div
          className={cn("h-full rounded-full transition-all duration-500", barClassName ?? colorForValue(pct))}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="w-9 shrink-0 text-right text-xs font-medium tabular-nums text-slate-500">
          {pct}%
        </span>
      )}
    </div>
  );
}
