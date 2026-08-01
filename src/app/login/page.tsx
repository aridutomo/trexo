"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, CheckCircle2, KanbanSquare, BarChart3, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TrexoLogo, TrexoWordmarkLight } from "@/components/brand/TrexoLogo";
import { useTrexo } from "@/lib/store";

const highlights = [
  { icon: KanbanSquare, text: "Kanban drag & drop ala Jira untuk alur kerja visual" },
  { icon: CheckCircle2, text: "Steps checklist dengan progress otomatis" },
  { icon: BarChart3, text: "Reporting + export Excel dalam satu klik" },
];

export default function LoginPage() {
  const router = useRouter();
  const login = useTrexo((s) => s.login);
  const [email, setEmail] = useState("ari@trexo.app");
  const [password, setPassword] = useState("trexo123");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.includes("@")) {
      setError("Masukkan email yang valid.");
      return;
    }
    if (password.length < 4) {
      setError("Password minimal 4 karakter.");
      return;
    }
    setLoading(true);
    // Mock auth — di produksi diganti NextAuth / Supabase Auth
    setTimeout(() => {
      login(email, "Ari Utomo");
      router.replace("/app/dashboard");
    }, 500);
  };

  const demoLogin = () => {
    setLoading(true);
    login("ari@trexo.app", "Ari Utomo");
    router.replace("/app/dashboard");
  };

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
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Selamat datang kembali</h2>
          <p className="mt-1.5 text-sm text-slate-500">
            Masuk untuk melanjutkan ke workspace Anda.
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <Input
              label="Email"
              type="email"
              name="email"
              placeholder="kamu@perusahaan.com"
              leftIcon={<Mail className="h-4 w-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand-600" defaultChecked />
                Ingat saya
              </label>
              <button type="button" className="text-sm font-medium text-brand-600 hover:text-brand-700">
                Lupa password?
              </button>
            </div>
            <Button type="submit" size="lg" className="w-full" loading={loading}>
              Masuk
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400">atau</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <Button variant="outline" size="lg" className="w-full" onClick={demoLogin} type="button">
            <GoogleIcon className="h-4 w-4" />
            Masuk dengan Google
          </Button>

          <div className="mt-6 rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3 text-center text-xs text-brand-700">
            🚀 Mode demo — klik <strong>Masuk dengan Google</strong> untuk langsung masuk tanpa kredensial.
          </div>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
