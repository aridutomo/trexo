"use client";

import { Menu, Search } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { EnvBadge } from "@/components/layout/EnvBadge";

export function Topbar({
  title,
  onMenuClick,
  onSearchClick,
  onOpenPalette,
}: {
  title: string;
  onMenuClick?: () => void;
  onSearchClick?: () => void;
  onOpenPalette?: () => void;
}) {
  return (
    <header className="glass sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-border px-3 sm:px-4 lg:px-6">
      <button
        onClick={onMenuClick}
        className="-ml-1 flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:bg-muted lg:hidden"
        aria-label="Buka menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <h1 className="truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl">
        {title}
      </h1>
      <EnvBadge />

      <div className="ml-auto flex items-center gap-1.5">
        {/* Mobile: open full-screen search */}
        <button
          onClick={onSearchClick}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:bg-muted sm:hidden"
          aria-label="Cari"
        >
          <Search className="h-5 w-5" />
        </button>

        {/* Desktop: command palette trigger styled as a search field */}
        <button
          onClick={onOpenPalette}
          className="hidden h-10 cursor-pointer items-center gap-2 rounded-xl border border-input bg-muted/60 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted sm:flex lg:w-72"
          aria-label="Buka pencarian (⌘K)"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Cari task…</span>
          <kbd className="pointer-events-none hidden select-none rounded-md border border-border bg-card px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground lg:inline-block">
            ⌘K
          </kbd>
        </button>

        <NotificationBell />
        <ThemeToggle />
      </div>
    </header>
  );
}
