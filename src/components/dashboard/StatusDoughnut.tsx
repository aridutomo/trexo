"use client";

import "@/lib/register-charts";
import { Doughnut } from "react-chartjs-2";
import type { ChartOptions, TooltipItem } from "chart.js";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { STATUS_META, STATUS_ORDER, type TaskStatus } from "@/lib/types";

interface Props {
  counts: Record<TaskStatus, number>;
}

const COLORS: Record<TaskStatus, string> = {
  todo: "#94a3b8",
  in_progress: "#3b82f6",
  review: "#f59e0b",
  done: "#10b981",
};

export function StatusDoughnut({ counts }: Props) {
  const data = {
    labels: STATUS_ORDER.map((s) => STATUS_META[s].label),
    datasets: [
      {
        data: STATUS_ORDER.map((s) => counts[s]),
        backgroundColor: STATUS_ORDER.map((s) => COLORS[s]),
        borderWidth: 0,
        borderRadius: 6,
        spacing: 2,
        hoverOffset: 8,
      },
    ],
  };

  const total = STATUS_ORDER.reduce((acc, s) => acc + counts[s], 0);

  const options: ChartOptions<"doughnut"> = {
    cutout: "72%",
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(15,23,42,0.92)",
        padding: 10,
        cornerRadius: 10,
        titleFont: { size: 12, weight: 600 as const },
        bodyFont: { size: 12 },
        callbacks: {
          label: (ctx: TooltipItem<"doughnut">) => {
            const v = ctx.parsed;
            const pct = total ? Math.round((v / total) * 100) : 0;
            return `${v} task (${pct}%)`;
          },
        },
      },
    },
    maintainAspectRatio: false,
  };

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Distribusi Status</h3>
          <p className="text-xs text-slate-400">Sebaran task per tahap</p>
        </div>
      </CardHeader>
      <CardBody className="flex flex-1 items-center gap-4">
        <div className="relative h-40 w-40 shrink-0">
          <Doughnut data={data} options={options} />
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-3xl font-bold tabular-nums text-slate-900">{total}</span>
            <span className="text-xs font-medium text-slate-400">Total</span>
          </div>
        </div>
        <ul className="flex-1 space-y-2">
          {STATUS_ORDER.map((s) => (
            <li key={s} className="flex items-center gap-2 text-sm">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[s] }} />
              <span className="flex-1 text-slate-600">{STATUS_META[s].label}</span>
              <span className="font-semibold tabular-nums text-slate-900">{counts[s]}</span>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
