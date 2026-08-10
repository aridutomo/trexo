"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Search, BarChart3, UserRound, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTrexo } from "@/lib/store";
import { AddTaskModal } from "@/components/task/AddTaskModal";

interface Props {
  onSearch: () => void;
}

export function MobileNav({ onSearch }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const projects = useTrexo((s) => s.projects);
  const activeWorkspaceId = useTrexo((s) => s.activeWorkspaceId);
  const [addOpen, setAddOpen] = useState(false);

  // Default project for the global quick-add FAB: first project in the active workspace.
  const defaultProject = projects.find((p) => p.workspaceId === activeWorkspaceId);

  const isActive = (key: string, href?: string) => {
    if (!href) return false;
    if (key === "home") return pathname === "/app/dashboard";
    return pathname.startsWith(href);
  };

  const tabs = [
    { key: "home", label: "Beranda", icon: LayoutDashboard, href: "/app/dashboard" },
    { key: "search", label: "Cari", icon: Search, action: "search" as const },
    { key: "report", label: "Laporan", icon: BarChart3, href: "/app/report" },
    { key: "profile", label: "Profil", icon: UserRound, href: "/app/settings" },
  ];

  const handleFAB = () => {
    if (defaultProject) setAddOpen(true);
    else router.push("/app/dashboard");
  };

  return (
    <>
      <nav className="glass fixed inset-x-0 bottom-0 z-30 border-t border-border pb-safe">
        <div className="relative mx-auto grid max-w-md grid-cols-5">
          {tabs.slice(0, 2).map((tab) => (
            <TabButton
              key={tab.key}
              tab={tab}
              active={isActive(tab.key, tab.href)}
              onClick={() => (tab.action === "search" ? onSearch() : router.push(tab.href!))}
            />
          ))}

          {/* Center quick-add FAB */}
          <div className="flex items-start justify-center">
            <button
              onClick={handleFAB}
              aria-label="Tambah task"
              className="-mt-6 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-brand-600 text-white shadow-lift ring-4 ring-background transition-transform active:scale-90 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-400"
            >
              <Plus className="h-6 w-6" strokeWidth={2.5} />
            </button>
          </div>

          {tabs.slice(2).map((tab) => (
            <TabButton
              key={tab.key}
              tab={tab}
              active={isActive(tab.key, tab.href)}
              onClick={() => (tab.action === "search" ? onSearch() : router.push(tab.href!))}
            />
          ))}
        </div>
      </nav>

      {defaultProject && (
        <AddTaskModal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          projectId={defaultProject.id}
          onCreate={(id) => router.push(`/app/tasks/${id}`)}
        />
      )}
    </>
  );
}

function TabButton({
  tab,
  active,
  onClick,
}: {
  tab: { key: string; label: string; icon: typeof LayoutDashboard };
  active: boolean;
  onClick: () => void;
}) {
  const Icon = tab.icon;
  return (
    <button
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-1 py-2.5 transition-colors",
        active ? "text-brand-600 dark:text-brand-400" : "text-muted-foreground active:text-foreground"
      )}
    >
      <span
        className={cn(
          "flex h-8 w-12 items-center justify-center rounded-xl transition-all",
          active ? "bg-brand-500/10" : "bg-transparent"
        )}
      >
        <Icon className="h-[22px] w-[22px] transition-transform" strokeWidth={active ? 2.4 : 2} />
      </span>
      <span className={cn("text-[11px] leading-none", active ? "font-semibold" : "font-medium")}>
        {tab.label}
      </span>
    </button>
  );
}
