"use client";

import { useActionState, useState } from "react";
import { Mail, Lock, ArrowRight, User as UserIcon, CheckCircle2, KanbanSquare, BarChart3, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TrexoLogo, TrexoWordmarkLight } from "@/components/brand/TrexoLogo";
import { signInAction, signUpAction, type AuthState } from "./actions";

const highlights = [
  { icon: KanbanSquare, text: "Kanban drag & drop ala Jira untuk alur kerja visual" },
  { icon: CheckCircle2, text: "Steps checklist dengan progress otomatis" },
  { icon: BarChart3, text: "Reporting + export Excel dalam satu klik" },
];

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);

  const [loginState, loginAction, loginPending] = useActionState<AuthState, FormData>(signInAction, undefined);
  const [registerState, registerAction, registerPending] = useActionState<AuthState, FormData>(signUpAction, undefined);

  const pending = mode === "login" ? loginPending : registerPending;
  const state = mode === "login" ? loginState : registerState;
  const formAction = mode === "login" ? loginAction : registerAction;

  return (
    <div className="flex min-h-screen">
      {/* Panel brand */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-slate-950 p-12 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(55% 55% at 15% 12%, rgba(99,102,241,0.55) 0%, transparent 60%), radial-gradient(45% 45% at 88% 28%, rgba(139,92,246,0.35) 0%, transparent 55%), radial-gradient(60% 60% at 70% 95%, rgba(79,70,229,0.45) 0%, transparent 60%)",
          }}
        />
        <div
          className="pointer-events-none absolute -left-24 top-1/3 h-72 w-72 rounded-full opacity-30 blur-3xl"
          style={{ background: "rgba(129,140,248,0.6)" }}
        />
        <div className="relative">
          <TrexoWordmarkLight />
        </div>
        <div className="relative max-w-md">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            Atur pekerjaan pribadi &amp; perusahaan dalam satu tempat.
          </h1>
          <p className="mt-4 text-base text-slate-300">
            Trexo menyatukan workspace, project, dan task dengan Kanban yang ringan serta
            reporting yang siap diekspor.
          </p>
          <ul className="mt-8 space-y-3.5">
            {highlights.map((h) => (
              <li key={h.text} className="flex items-start gap-3 text-sm text-slate-200">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <h.icon className="h-4 w-4 text-brand-300" />
                </span>
                {h.text}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative text-xs text-slate-400">
          © {new Date().getFullYear()} Trexo. Dibuat untuk produktivitas.
        </div>
      </div>

      {/* Panel form */}
      <div className="flex w-full flex-col items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <TrexoLogo className="h-12 w-12" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {mode === "login" ? "Selamat datang kembali" : "Buat akun baru"}
          </h2>
          <p className="mt-1.5 text-sm text-slate-500">
            {mode === "login"
              ? "Masuk untuk melanjutkan ke workspace Anda."
              : "Daftar untuk mulai mengatur pekerjaan Anda."}
          </p>

          <form action={formAction} className="mt-7 space-y-4">
            {mode === "register" && (
              <Input
                label="Nama"
                type="text"
                name="name"
                placeholder="Nama lengkap"
                leftIcon={<UserIcon className="h-4 w-4" />}
                autoComplete="name"
                required
              />
            )}
            <Input
              label="Email"
              type="email"
              name="email"
              placeholder="kamu@perusahaan.com"
              leftIcon={<Mail className="h-4 w-4" />}
              autoComplete="email"
              required
            />
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="••••••••"
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={8}
            />
            {state?.error && <p className="text-sm text-rose-600">{state.error}</p>}
            <Button type="submit" size="lg" className="w-full" loading={pending}>
              {mode === "login" ? "Masuk" : "Daftar"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {mode === "login" ? "Belum punya akun? " : "Sudah punya akun? "}
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="font-semibold text-brand-600 hover:text-brand-700"
            >
              {mode === "login" ? "Daftar di sini" : "Masuk"}
            </button>
          </p>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-center text-xs text-slate-500">
            Password minimal 8 karakter. Akun disimpan via better-auth di database MySQL Anda.
          </div>
        </div>
      </div>
    </div>
  );
}
