"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Light/Dark toggle. Renders a neutral placeholder until mounted to avoid
 * hydration mismatch (theme is only known on the client).
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:bg-muted/70",
        className
      )}
    >
      {/* Sun (shown in light) / Moon (shown in dark). Placeholder until mounted. */}
      {mounted ? (
        isDark ? (
          <Sun className="h-5 w-5 transition-transform duration-300 [transform:rotate(0deg)_scale(1)]" />
        ) : (
          <Moon className="h-5 w-5 transition-transform duration-300 [transform:rotate(0deg)_scale(1)]" />
        )
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </button>
  );
}
