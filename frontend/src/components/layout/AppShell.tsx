"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MobileNav } from "./MobileNav";
import { MobileSearchOverlay } from "./MobileSearchOverlay";
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
    // validating session / loading data / redirecting
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <TrexoLogo className="h-10 w-10 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar desktop */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Sidebar mobile (drawer) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
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
        />
        <main className="scrollbar-thin flex-1 overflow-y-auto pb-24 lg:pb-0">{children}</main>
      </div>

      {/* Mobile bottom nav + search */}
      <MobileNav onSearch={() => setSearchOpen(true)} />
      <MobileSearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
