"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useHydrated, useTrexo } from "@/lib/store";
import { TrexoLogo } from "@/components/brand/TrexoLogo";

export default function Home() {
  const router = useRouter();
  const hydrated = useHydrated();
  const user = useTrexo((s) => s.user);

  useEffect(() => {
    if (!hydrated) return;
    router.replace(user ? "/app/dashboard" : "/login");
  }, [hydrated, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <TrexoLogo className="h-10 w-10 animate-pulse" />
        <p className="text-sm">Memuat Trexo…</p>
      </div>
    </div>
  );
}
