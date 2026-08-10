"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { User, RotateCcw, LogOut, Shield, Palette } from "lucide-react";
import { useTrexo } from "@/lib/store";
import { useLogout } from "@/hooks/useLogout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";

export default function SettingsPage() {
  const router = useRouter();
  const user = useTrexo((s) => s.user);
  const bootstrap = useTrexo((s) => s.bootstrap);
  const logout = useLogout();
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 lg:p-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Pengaturan</h2>
        <p className="mt-1 text-sm text-muted-foreground">Kelola profil dan preferensi akun Anda.</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <User className="h-4 w-4 text-muted-foreground" /> Profil
          </h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar name={user?.name ?? "U"} color={user?.avatarColor} size="lg" />
            <div>
              <p className="font-semibold text-foreground">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <span className="mt-1 inline-block rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium capitalize text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                Login via {user?.authProvider}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Nama" defaultValue={user?.name} disabled />
            <Input label="Email" defaultValue={user?.email} disabled />
          </div>
          <p className="text-xs text-muted-foreground">
            Mode demo: perubahan profil nonaktif. Pada produksi tersambung ke backend.
          </p>
        </CardBody>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Palette className="h-4 w-4 text-muted-foreground" /> Preferensi
          </h3>
        </CardHeader>
        <CardBody className="space-y-3">
          <ToggleRow label="Notifikasi email" description="Pengingat jatuh tempo task." defaultOn />
          <ThemeToggleRow />
        </CardBody>
      </Card>

      {/* Danger zone */}
      <Card className="border-rose-200 dark:border-rose-500/30">
        <CardHeader>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-rose-700 dark:text-rose-400">
            <Shield className="h-4 w-4" /> Zona Berbahaya
          </h3>
        </CardHeader>
        <CardBody className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={() => setConfirmReset(true)}>
            <RotateCcw className="h-4 w-4" />
            Muat Ulang Data
          </Button>
          <Button variant="outline" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Keluar
          </Button>
        </CardBody>
      </Card>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Muat ulang data dari server?"
        description="Data lokal akan disinkronkan ulang dengan backend."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>Batal</Button>
            <Button
              variant="danger"
              onClick={() => {
                void bootstrap().finally(() => {
                  setConfirmReset(false);
                  router.replace("/app/dashboard");
                });
              }}
            >
              <RotateCcw className="h-4 w-4" />
              Muat Ulang
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">Perubahan lokal yang belum tersinkron akan hilang.</p>
      </Modal>
    </div>
  );
}

function ThemeToggleRow() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const on = mounted && resolvedTheme === "dark";

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-foreground">Mode gelap</p>
        <p className="text-xs text-muted-foreground">Tampilan gelap untuk kenyamanan mata.</p>
      </div>
      <button
        onClick={() => setTheme(on ? "light" : "dark")}
        role="switch"
        aria-checked={on}
        className={`relative h-6 w-11 cursor-pointer rounded-full transition-colors duration-200 ${on ? "bg-brand-600" : "bg-muted-foreground/30"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${on ? "translate-x-5" : "translate-x-0"}`}
        />
      </button>
    </div>
  );
}

function ToggleRow({ label, description, defaultOn = false }: { label: string; description: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        onClick={() => setOn((v) => !v)}
        role="switch"
        aria-checked={on}
        className={`relative h-6 w-11 cursor-pointer rounded-full transition-colors duration-200 ${on ? "bg-brand-600" : "bg-muted-foreground/30"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${on ? "translate-x-5" : "translate-x-0"}`}
        />
      </button>
    </div>
  );
}
