"use client";

import { cn } from "@/lib/utils";

/**
 * Penanda environment — pill merah "stg" yang SELALU terlihat saat app
 * terhubung ke STAGING, biar gampang bedain dengan production.
 *
 * Mengikuti `NEXT_PUBLIC_APP_ENV` (di-inline Next.js saat build/dev):
 *  - "staging" → tampil merah
 *  - lainnya / kosong → tidak render (production tetap bersih)
 */
const IS_STAGING = process.env.NEXT_PUBLIC_APP_ENV === "staging";

export function EnvBadge({ className }: { className?: string }) {
  if (!IS_STAGING) return null;
  return (
    <span
      title="Terhubung ke STAGING (trexo_stg) — bukan production"
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-md bg-red-600 px-1.5 py-0.5 text-[11px] font-bold uppercase leading-none tracking-wider text-white shadow-sm ring-1 ring-inset ring-red-500/50",
        className,
      )}
    >
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/90" />
      stg
    </span>
  );
}
