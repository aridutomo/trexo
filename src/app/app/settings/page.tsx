"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, RotateCcw, LogOut, Shield, Palette } from "lucide-react";
import { useTrexo } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";

export default function SettingsPage() {
  const router = useRouter();
  const user = useTrexo((s) => s.user);
  const logout = useTrexo((s) => s.logout);
  const resetData = useTrexo((s) => s.resetData);
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 lg:p-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Pengaturan</h2>
        <p className="mt-1 text-sm text-slate-500">Kelola profil dan preferensi akun Anda.</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <User className="h-4 w-4 text-slate-400" /> Profil
          </h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar name={user?.name ?? "U"} color={user?.avatarColor} size="lg" />
            <div>
              <p className="font-semibold text-slate-900">{user?.name}</p>
              <p className="text-sm text-slate-500">{user?.email}</p>
              <span className="mt-1 inline-block rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium capitalize text-brand-700">
                Login via {user?.authProvider}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Nama" defaultValue={user?.name} disabled />
            <Input label="Email" defaultValue={user?.email} disabled />
          </div>
          <p className="text-xs text-slate-400">
            Mode demo: perubahan profil nonaktif. Pada produksi tersambung ke backend.
          </p>
        </CardBody>
      </Card>

      {/* Preferences (decorative) */}
      <Card>
        <CardHeader>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Palette className="h-4 w-4 text-slate-400" /> Preferensi
          </h3>
        </CardHeader>
        <CardBody className="space-y-3">
          <ToggleRow label="Notifikasi email" description="Pengingat jatuh tempo task." defaultOn />
          <ToggleRow label="Mode gelap" description="Tampilan gelap (segera hadir)." />
        </CardBody>
      </Card>

      {/* Danger zone */}
      <Card className="border-rose-200">
        <CardHeader>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-rose-700">
            <Shield className="h-4 w-4" /> Zona Berbahaya
          </h3>
        </CardHeader>
        <CardBody className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={() => setConfirmReset(true)}>
            <RotateCcw className="h-4 w-4" />
            Reset Data Demo
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              logout();
              router.replace("/login");
            }}
          >
            <LogOut className="h-4 w-4" />
            Keluar
          </Button>
        </CardBody>
      </Card>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset semua data demo?"
        description="Semua perubahan akan dikembalikan ke data awal."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>Batal</Button>
            <Button
              variant="danger"
              onClick={() => {
                resetData();
                setConfirmReset(false);
                router.replace("/app/dashboard");
              }}
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-500">Tindakan ini tidak dapat dibatalkan.</p>
      </Modal>
    </div>
  );
}

function ToggleRow({ label, description, defaultOn = false }: { label: string; description: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
      <button
        onClick={() => setOn((v) => !v)}
        role="switch"
        aria-checked={on}
        className={`relative h-6 w-11 cursor-pointer rounded-full transition-colors duration-200 ${on ? "bg-brand-600" : "bg-slate-300"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${on ? "translate-x-5" : "translate-x-0"}`}
        />
      </button>
    </div>
  );
}
