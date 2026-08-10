import { cn } from "@/lib/utils";

const toneClasses = {
  brand: "bg-brand-50 text-brand-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  sky: "bg-sky-50 text-sky-600",
  rose: "bg-rose-50 text-rose-600",
  violet: "bg-violet-50 text-violet-600",
  slate: "bg-slate-100 text-slate-600",
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
        "rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift sm:p-5",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", toneClasses[tone])}>
          {icon}
        </span>
      </div>
      <div className="mt-4">
        <div className="font-display text-[26px] font-bold leading-none tabular-nums text-slate-900">
          {value}
        </div>
        <div className="mt-1.5 text-sm font-medium text-slate-500">{label}</div>
        {hint && <div className="mt-0.5 text-xs text-slate-400">{hint}</div>}
      </div>
    </div>
  );
}
