"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MobileNav } from "./MobileNav";
import { MobileSearchOverlay } from "./MobileSearchOverlay";
import { CommandPalette } from "./CommandPalette";
import { useTrexo } from "@/lib/store";
import { useSession } from "@/lib/auth-client";
import { TrexoLogo } from "@/components/brand/TrexoLogo";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  const user = useTrexo((s) => s.user);
  const bootstrapped = useTrexo((s) => s.bootstrapped);
  const loginFromSession = useTrexo((s) => s.loginFromSession);
  const bootstrap = useTrexo((s) => s.bootstrap);
  const projects = useTrexo((s) => s.projects);
  const tasks = useTrexo((s) => s.tasks);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Global ⌘K / Ctrl+K opens the command palette.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Auth gate + data load. The middleware already bounces cookie-less requests
  // to /login; here we validate the session for real and hydrate the store.
  useEffect(() => {
    if (isPending) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    if (!user) loginFromSession(session.user);
    if (!bootstrapped) void bootstrap();
  }, [isPending, session, user, bootstrapped, loginFromSession, bootstrap, router]);

  // Resolve title
  const title = (() => {
    if (pathname === "/app/dashboard") return "Dashboard";
    if (pathname.startsWith("/app/report")) return "Report";
    if (pathname.startsWith("/app/settings")) return "Pengaturan";
    const projectMatch = pathname.match(/^\/app\/projects\/([^/]+)$/);
    if (projectMatch) {
      return projects.find((p) => p.id === projectMatch[1])?.name ?? "Project";
    }
    const taskMatch = pathname.match(/^\/app\/tasks\/([^/]+)$/);
    if (taskMatch) {
      return tasks.find((t) => t.id === taskMatch[1])?.name ?? "Detail Task";
    }
    return "Trexo";
  })();

  if (isPending || !user || !bootstrapped) {
    return <ShellSkeleton />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar desktop */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Sidebar mobile (drawer) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm animate-fade-in dark:bg-black/70"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full animate-slide-in">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Konten */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          title={title}
          onMenuClick={() => setMobileOpen(true)}
          onSearchClick={() => setSearchOpen(true)}
          onOpenPalette={() => setPaletteOpen(true)}
        />
        <main className="scrollbar-thin flex-1 overflow-y-auto pb-28 lg:pb-24">{children}</main>
      </div>

      {/* Mobile bottom nav + search */}
      <MobileNav onSearch={() => setSearchOpen(true)} />
      <MobileSearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}

/** Branded loading skeleton — faux shell while the session/data resolve. */
function ShellSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Faux sidebar */}
      <div className="hidden w-[264px] shrink-0 flex-col gap-4 border-r border-border bg-sidebar p-4 lg:flex">
        <div className="flex items-center gap-2.5">
          <TrexoLogo className="h-8 w-8" />
          <div className="h-4 w-16 rounded bg-muted" />
        </div>
        <div className="h-10 rounded-xl bg-muted" />
        <div className="mt-4 space-y-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-8 rounded-lg bg-muted" />
          ))}
        </div>
      </div>
      {/* Faux content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-16 items-center gap-3 border-b border-border px-6">
          <div className="h-5 w-32 rounded bg-muted" />
          <div className="ml-auto h-10 w-56 rounded-xl bg-muted lg:w-72" />
        </div>
        <div className="flex-1 space-y-6 overflow-hidden p-4 lg:p-8">
          <div className="space-y-2">
            <div className="h-7 w-56 rounded bg-muted" />
            <div className="h-4 w-72 rounded bg-muted" />
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-2xl border border-border bg-card shadow-card" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="h-64 rounded-2xl border border-border bg-card shadow-card" />
            <div className="h-64 rounded-2xl border border-border bg-card shadow-card" />
          </div>
        </div>
      </div>
    </div>
  );
}
