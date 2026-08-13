"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Format tampilan tanggal di seluruh app: dd/MM/yyyy. */
export const DATE_DISPLAY_FORMAT = "dd/MM/yyyy";

interface DatePickerProps {
  /** Nilai tanggal dalam ISO string (mis. task.dueDate). */
  value?: string;
  onChange: (iso: string | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pilih tanggal",
  className,
  disabled,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<Date>(() => (value ? new Date(value) : new Date()));
  const ref = useRef<HTMLDivElement>(null);

  // Saat ditutup, ikat bulan yang tampil ke nilai terbaru.
  useEffect(() => {
    if (!open && value) setView(new Date(value));
  }, [value, open]);

  // Tutup popover saat klik di luar atau tekan Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selected = value ? new Date(value) : null;

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(view), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(view), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [view]);

  // Label hari Senin–Minggu (mulai Senin).
  const weekdays = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(new Date(2024, 0, 1), { weekStartsOn: 1 }),
        end: endOfWeek(new Date(2024, 0, 1), { weekStartsOn: 1 }),
      }).map((d) => format(d, "EEE", { locale: localeId })),
    [],
  );

  const selectDay = (d: Date) => {
    const iso = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59).toISOString();
    onChange(iso);
    setOpen(false);
  };

  return (
    <div ref={ref} className={cn("relative", className)}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-expanded={open}
        aria-disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
        className={cn(
          "flex h-10 w-full cursor-pointer items-center gap-2 rounded-xl border border-input bg-card px-3 text-left text-sm text-foreground transition-colors focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/15",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className={cn("flex-1 truncate", !selected && "text-muted-foreground")}>
          {selected ? format(selected, DATE_DISPLAY_FORMAT) : placeholder}
        </span>
        {selected && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(undefined);
            }}
            aria-label="Hapus tanggal"
            className="shrink-0 rounded-md p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1.5 w-[19rem] origin-top-left rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-lift animate-scale-in">
          {/* Header bulan */}
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setView((v) => subMonths(v, 1))}
              className="cursor-pointer rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Bulan sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold capitalize text-foreground">
              {format(view, "MMMM yyyy", { locale: localeId })}
            </span>
            <button
              type="button"
              onClick={() => setView((v) => addMonths(v, 1))}
              className="cursor-pointer rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Bulan berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Baris hari */}
          <div className="mb-1 grid grid-cols-7 gap-1">
            {weekdays.map((w) => (
              <div
                key={w}
                className="py-1 text-center text-[11px] font-medium uppercase text-muted-foreground"
              >
                {w}
              </div>
            ))}
          </div>

          {/* Grid tanggal */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((d) => {
              const off = !isSameMonth(d, view);
              const isSel = !!selected && isSameDay(d, selected);
              const today = isToday(d);
              return (
                <button
                  key={d.toISOString()}
                  type="button"
                  onClick={() => selectDay(d)}
                  className={cn(
                    "aspect-square rounded-lg text-sm transition-colors hover:bg-muted",
                    off ? "text-muted-foreground/40" : "text-foreground",
                    today && !isSel && "font-semibold text-brand-600 dark:text-brand-400",
                    isSel && "bg-brand-500 font-semibold text-white hover:bg-brand-600",
                  )}
                >
                  {format(d, "d")}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
            <button
              type="button"
              onClick={() => selectDay(new Date())}
              className="cursor-pointer rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Hari ini
            </button>
            {selected && (
              <button
                type="button"
                onClick={() => {
                  onChange(undefined);
                  setOpen(false);
                }}
                className="cursor-pointer rounded-md px-2 py-1 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
              >
                Hapus
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
