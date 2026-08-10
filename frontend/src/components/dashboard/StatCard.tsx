import { cn } from "@/lib/utils";

const toneClasses = {
  brand: "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300",
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
  sky: "bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300",
  rose: "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
  violet: "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300",
  slate: "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300",
};

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: React.ReactNode;
  tone?: keyof typeof toneClasses;
  className?: string;
}

export function StatCard({ label, value, hint, icon, tone = "brand", className }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift sm:p-5",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", toneClasses[tone])}>
          {icon}
        </span>
      </div>
      <div className="mt-4">
        <div className="font-display text-[26px] font-bold leading-none tabular-nums text-foreground">
          {value}
        </div>
        <div className="mt-1.5 text-sm font-medium text-muted-foreground">{label}</div>
        {hint && <div className="mt-0.5 text-xs text-muted-foreground/80">{hint}</div>}
      </div>
    </div>
  );
}
