"use client";

import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Search, BarChart3, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onSearch: () => void;
}

const TABS = [
  { key: "home", label: "Beranda", icon: LayoutDashboard, href: "/app/dashboard" },
  { key: "search", label: "Cari", icon: Search, action: "search" as const },
  { key: "report", label: "Laporan", icon: BarChart3, href: "/app/report" },
  { key: "profile", label: "Profil", icon: UserRound, href: "/app/settings" },
];

export function MobileNav({ onSearch }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (key: string, href?: string) => {
    if (!href) return false;
    if (key === "home") return pathname === "/app/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <nav className="glass fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/70 lg:hidden pb-safe">
      <div className="mx-auto grid max-w-md grid-cols-4">
        {TABS.map((tab) => {
          const active = isActive(tab.key, tab.href);
          const Icon = tab.icon;
          const handle = () => {
            if (tab.action === "search") onSearch();
            else if (tab.href) router.push(tab.href);
          };
          return (
            <button
              key={tab.key}
              onClick={handle}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-1 py-2.5 transition-colors",
                active ? "text-brand-600" : "text-slate-400 active:text-slate-600"
              )}
            >
              <Icon
                className={cn("h-[22px] w-[22px] transition-transform", active && "scale-105")}
                strokeWidth={active ? 2.4 : 2}
              />
              <span className={cn("text-[11px] leading-none", active ? "font-semibold" : "font-medium")}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
