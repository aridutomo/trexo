"use client";

import { useTheme } from "next-themes";

/**
 * Theme-aware palette for chart.js options. Segment (status/difficulty) colours
 * stay fixed and semantic; only the chrome — tooltip, gridlines, axis ticks —
 * flips with the theme. Returns light defaults until the theme resolves on the
 * client to avoid SSR mismatch.
 */
export function useChartTheme() {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  return {
    tooltipBg: dark ? "rgba(226, 232, 240, 0.96)" : "rgba(15, 23, 42, 0.92)",
    tooltipText: dark ? "#0f172a" : "#ffffff",
    grid: dark ? "rgba(255, 255, 255, 0.06)" : "#eef2f7",
    tick: dark ? "#94a3b8" : "#64748b",
  };
}
