"use client";

import "@/lib/register-charts";
import { Bar } from "react-chartjs-2";
import type { ChartOptions } from "chart.js";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { DIFFICULTY_META, type TaskDifficulty } from "@/lib/types";

interface Props {
  counts: Record<TaskDifficulty, number>;
}

const ORDER: TaskDifficulty[] = ["easy", "medium", "hard"];
const COLORS: Record<TaskDifficulty, string> = {
  easy: "#10b981",
  medium: "#f59e0b",
  hard: "#f43f5e",
};

export function DifficultyBar({ counts }: Props) {
  const data = {
    labels: ORDER.map((d) => DIFFICULTY_META[d].label),
    datasets: [
      {
        label: "Task",
        data: ORDER.map((d) => counts[d]),
        backgroundColor: ORDER.map((d) => COLORS[d]),
        borderRadius: 8,
        maxBarThickness: 44,
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(15,23,42,0.92)",
        padding: 10,
        cornerRadius: 10,
        displayColors: false,
        bodyFont: { size: 12, weight: 600 as const },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#64748b", font: { size: 12 } } },
      y: {
        beginAtZero: true,
        ticks: { precision: 0, color: "#94a3b8", font: { size: 11 } },
        grid: { color: "#f1f5f9" },
        border: { display: false },
      },
    },
    maintainAspectRatio: false,
  };

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <h3 className="text-sm font-semibold text-slate-900">Distribusi Kesulitan</h3>
        <p className="text-xs text-slate-400">Jumlah task per tingkat kesulitan</p>
      </CardHeader>
      <CardBody className="flex-1">
        <div className="h-44">
          <Bar data={data} options={options} />
        </div>
      </CardBody>
    </Card>
  );
}
