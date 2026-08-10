"use client";

import { useState } from "react";
import { Plus, Trash2, ListChecks, GripVertical } from "lucide-react";
import { Checkbox } from "@/components/ui/Checkbox";
import { Progress } from "@/components/ui/Progress";
import { useTrexo } from "@/lib/store";
import { cn, computeProgress } from "@/lib/utils";
import type { Task } from "@/lib/types";

export function TaskSteps({ task }: { task: Task }) {
  const addStep = useTrexo((s) => s.addStep);
  const toggleStep = useTrexo((s) => s.toggleStep);
  const updateStep = useTrexo((s) => s.updateStep);
  const deleteStep = useTrexo((s) => s.deleteStep);

  const [newStep, setNewStep] = useState("");
  const progress = computeProgress(task);
  const done = task.steps.filter((s) => s.completed).length;

  const submit = async () => {
    if (!newStep.trim()) return;
    const value = newStep.trim();
    setNewStep("");
    try {
      await addStep(task.id, value);
    } catch (e) {
      console.error("[trexo] addStep failed:", e);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <ListChecks className="h-4 w-4 text-slate-400" />
          Steps / Checklist
        </h3>
        {task.steps.length > 0 && (
          <span className="text-xs font-medium tabular-nums text-slate-500">
            {done}/{task.steps.length} selesai · {progress}%
          </span>
        )}
      </div>

      {task.steps.length > 0 && (
        <div className="mb-4">
          <Progress value={progress} />
        </div>
      )}

      <div className="space-y-1">
        {task.steps.map((step) => (
          <div
            key={step.id}
            className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-50"
          >
            <GripVertical className="h-3.5 w-3.5 shrink-0 text-slate-300" />
            <Checkbox
              checked={step.completed}
              onChange={() => toggleStep(task.id, step.id)}
              aria-label={step.name}
            />
            <input
              defaultValue={step.name}
              onBlur={(e) => {
                if (e.target.value.trim() && e.target.value !== step.name) {
                  updateStep(task.id, step.id, e.target.value.trim());
                }
              }}
              className={cn(
                "flex-1 bg-transparent text-sm outline-none",
                step.completed ? "text-slate-400 line-through" : "text-slate-700"
              )}
            />
            <button
              onClick={() => deleteStep(task.id, step.id)}
              className="cursor-pointer rounded p-1 text-slate-300 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100"
              aria-label="Hapus step"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Add step */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="mt-2 flex items-center gap-2.5 px-2"
      >
        <span className="w-5" />
        <Plus className="h-4 w-4 text-slate-400" />
        <input
          value={newStep}
          onChange={(e) => setNewStep(e.target.value)}
          placeholder="Tambah step baru…"
          className="flex-1 bg-transparent py-1 text-sm text-slate-700 outline-none placeholder:text-slate-400"
        />
        {newStep.trim() && (
          <button
            type="submit"
            className="rounded-md bg-brand-50 px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-100"
          >
            Tambah
          </button>
        )}
      </form>

      {task.steps.length === 0 && (
        <p className="mt-2 px-2 text-xs text-slate-400">
          Belum ada step. Progress mengikuti status:{" "}
          <span className="font-medium text-slate-500">
            To Do 0% · In Progress 50% · Review 75% · Done 100%
          </span>
        </p>
      )}
    </div>
  );
}
