"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Lightbulb, Users } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { useTrexo } from "@/lib/store";
import type { TaskDifficulty, TaskSource, TaskStatus } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  projectId: string;
  defaultStatus?: TaskStatus;
  onCreate?: (taskId: string) => void;
}

const sources: { value: TaskSource; label: string; icon: React.ReactNode }[] = [
  { value: "own_idea", label: "Ide Sendiri", icon: <Lightbulb className="h-4 w-4" /> },
  { value: "user_request", label: "Permintaan User", icon: <Users className="h-4 w-4" /> },
];

const difficulties: { value: TaskDifficulty; label: string; ring: string }[] = [
  {
    value: "easy",
    label: "Mudah",
    ring:
      "data-[on=true]:border-emerald-500 data-[on=true]:bg-emerald-50 data-[on=true]:text-emerald-700 dark:data-[on=true]:bg-emerald-500/15 dark:data-[on=true]:text-emerald-300",
  },
  {
    value: "medium",
    label: "Medium",
    ring:
      "data-[on=true]:border-amber-500 data-[on=true]:bg-amber-50 data-[on=true]:text-amber-700 dark:data-[on=true]:bg-amber-500/15 dark:data-[on=true]:text-amber-300",
  },
  {
    value: "hard",
    label: "Susah",
    ring:
      "data-[on=true]:border-rose-500 data-[on=true]:bg-rose-50 data-[on=true]:text-rose-700 dark:data-[on=true]:bg-rose-500/15 dark:data-[on=true]:text-rose-300",
  },
];

const empty = { name: "", description: "", source: "own_idea" as TaskSource, difficulty: "medium" as TaskDifficulty, steps: [""] };

export function AddTaskModal({ open, onClose, projectId, defaultStatus = "todo", onCreate }: Props) {
  const addTask = useTrexo((s) => s.addTask);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(empty);
  }, [open]);

  const submit = async () => {
    if (!form.name.trim() || saving) return;
    setSaving(true);
    try {
      const steps = form.steps.map((s) => s.trim()).filter(Boolean);
      const task = await addTask({
        projectId,
        name: form.name.trim(),
        description: form.description.trim(),
        status: defaultStatus,
        source: form.source,
        difficulty: form.difficulty,
        steps,
      });
      onCreate?.(task.id);
      onClose();
    } catch (e) {
      console.error("[trexo] addTask failed:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tambah Task"
      description="Buat task baru lengkap dengan steps awal."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={submit} disabled={!form.name.trim() || saving} loading={saving}>
            Buat Task
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <Input
          label="Nama Task"
          placeholder="cth. Implementasi autentikasi OAuth"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          autoFocus
        />
        <Textarea
          label="Deskripsi (opsional)"
          rows={2}
          placeholder="Jelaskan singkat task ini…"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Sumber ide */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Sumber Ide</label>
            <div className="grid grid-cols-2 gap-2">
              {sources.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setForm((f) => ({ ...f, source: o.value }))}
                  data-on={form.source === o.value}
                  className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-input px-2 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted data-[on=true]:border-brand-500 data-[on=true]:bg-brand-50 data-[on=true]:text-brand-700 dark:data-[on=true]:bg-brand-500/15 dark:data-[on=true]:text-brand-300"
                >
                  {o.icon}
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Kesulitan */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Tingkat Kesulitan</label>
            <div className="grid grid-cols-3 gap-2">
              {difficulties.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setForm((f) => ({ ...f, difficulty: o.value }))}
                  data-on={form.difficulty === o.value}
                  className={cn(
                    "cursor-pointer rounded-xl border border-input px-2 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted",
                    o.ring
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Steps awal */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Steps Awal <span className="font-normal text-muted-foreground">(opsional)</span>
          </label>
          <div className="space-y-2">
            {form.steps.map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium text-muted-foreground">
                  {i + 1}
                </span>
                <input
                  value={step}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      steps: f.steps.map((s, idx) => (idx === i ? e.target.value : s)),
                    }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && i === form.steps.length - 1) {
                      e.preventDefault();
                      setForm((f) => ({ ...f, steps: [...f.steps, ""] }));
                    }
                  }}
                  placeholder={`Langkah ${i + 1}`}
                  className="h-9 flex-1 rounded-xl border border-input bg-card px-3 text-sm text-foreground focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
                />
                {form.steps.length > 1 && (
                  <button
                    onClick={() => setForm((f) => ({ ...f, steps: f.steps.filter((_, idx) => idx !== i) }))}
                    className="cursor-pointer rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={() => setForm((f) => ({ ...f, steps: [...f.steps, ""] }))}
            className="mt-2 inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
          >
            <Plus className="h-4 w-4" />
            Tambah step
          </button>
        </div>
      </div>
    </Modal>
  );
}
