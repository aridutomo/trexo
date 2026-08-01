"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  Plus,
  ChevronsUpDown,
  Building2,
  UserRound,
  Settings,
  LogOut,
  RotateCcw,
  Check,
  FolderKanban,
  ChevronDown,
} from "lucide-react";
import { TrexoLogo } from "@/components/brand/TrexoLogo";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { Dropdown } from "@/components/ui/Dropdown";
import { COLOR_PRESETS, PROJECT_ICONS } from "@/lib/constants";
import { useTrexo } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { WorkspaceType } from "@/lib/types";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const workspaces = useTrexo((s) => s.workspaces);
  const projects = useTrexo((s) => s.projects);
  const tasks = useTrexo((s) => s.tasks);
  const user = useTrexo((s) => s.user);
  const activeWorkspaceId = useTrexo((s) => s.activeWorkspaceId);
  const setActiveWorkspace = useTrexo((s) => s.setActiveWorkspace);
  const addWorkspace = useTrexo((s) => s.addWorkspace);
  const addProject = useTrexo((s) => s.addProject);
  const logout = useTrexo((s) => s.logout);
  const resetData = useTrexo((s) => s.resetData);

  const [wsModal, setWsModal] = useState(false);
  const [projectModal, setProjectModal] = useState(false);
  const [wsOpen, setWsOpen] = useState(false);

  const activeWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) ?? workspaces[0];
  const wsProjects = projects.filter((p) => p.workspaceId === activeWorkspace?.id);

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const handleReset = () => {
    resetData();
    router.replace("/app/dashboard");
  };

  const nav = (href: string) => {
    onNavigate?.();
    router.push(href);
  };

  return (
    <aside className="flex h-full w-[264px] shrink-0 flex-col border-r border-slate-200 bg-white text-slate-600">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 px-5">
        <TrexoLogo className="h-8 w-8" />
        <span className="font-display text-lg font-bold tracking-tight text-slate-900">Trexo</span>
      </div>

      {/* Workspace switcher */}
      <div className="px-3">
        <Dropdown
          align="left"
          trigger={
            <button
              type="button"
              className="flex w-full items-center gap-2.5 rounded-xl bg-slate-100 px-3 py-2.5 text-left transition-colors hover:bg-slate-200"
            >
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white"
                style={{ backgroundColor: activeWorkspace?.color }}
              >
                {activeWorkspace?.type === "company" ? (
                  <Building2 className="h-4 w-4" />
                ) : (
                  <UserRound className="h-4 w-4" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-900">
                  {activeWorkspace?.name}
                </span>
                <span className="block text-xs capitalize text-slate-500">
                  {activeWorkspace?.type === "company" ? "Workspace Perusahaan" : "Workspace Pribadi"}
                </span>
              </span>
              <ChevronsUpDown className="h-4 w-4 shrink-0 text-slate-500" />
            </button>
          }
          items={[
            ...workspaces.map((w) => ({
              label: w.name,
              icon: <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: w.color }} />,
              onClick: () => {
                setActiveWorkspace(w.id);
                nav("/app/dashboard");
              },
            })),
            { label: "", divider: true } as never,
            {
              label: "Tambah Workspace",
              icon: <Plus className="h-4 w-4" />,
              onClick: () => setWsModal(true),
            },
          ]}
        />
      </div>

      {/* Nav utama */}
      <nav className="mt-4 space-y-0.5 px-3">
        <NavItem
          icon={<LayoutDashboard className="h-4 w-4" />}
          label="Dashboard"
          active={pathname === "/app/dashboard"}
          onClick={() => nav("/app/dashboard")}
        />
        <NavItem
          icon={<BarChart3 className="h-4 w-4" />}
          label="Report"
          active={pathname.startsWith("/app/report")}
          onClick={() => nav("/app/report")}
        />
      </nav>

      {/* Projects */}
      <div className="mt-6 flex min-h-0 flex-1 flex-col px-3">
        <div className="mb-1.5 flex items-center justify-between px-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Project
          </span>
          <button
            onClick={() => setProjectModal(true)}
            className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            title="Tambah project"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="scrollbar-thin -mr-1 flex-1 space-y-0.5 overflow-y-auto pr-1">
          {wsProjects.length === 0 && (
            <p className="px-2 py-3 text-xs text-slate-400">Belum ada project.</p>
          )}
          {wsProjects.map((p) => {
            const count = tasks.filter((t) => t.projectId === p.id).length;
            const active = pathname === `/app/projects/${p.id}`;
            return (
              <button
                key={p.id}
                onClick={() => nav(`/app/projects/${p.id}`)}
                className={cn(
                  "group flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors",
                  active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <span className="text-base leading-none">{p.icon}</span>
                <span className="min-w-0 flex-1 truncate text-left">{p.name}</span>
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 text-[10px] font-medium tabular-nums",
                    active ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-500"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* User */}
      <div className="border-t border-slate-200 p-3">
        <Dropdown
          align="left"
          dropUp
          trigger={
            <button className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-slate-100">
              <Avatar name={user?.name ?? "User"} color={user?.avatarColor} size="sm" />
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate text-sm font-medium text-slate-900">
                  {user?.name}
                </span>
                <span className="block truncate text-xs text-slate-500">{user?.email}</span>
              </span>
              <ChevronDown className="h-4 w-4 text-slate-500" />
            </button>
          }
          items={[
            { label: "Pengaturan", icon: <Settings className="h-4 w-4" />, onClick: () => nav("/app/settings") },
            {
              label: "Reset data demo",
              icon: <RotateCcw className="h-4 w-4" />,
              onClick: handleReset,
            },
            { label: "", divider: true } as never,
            { label: "Keluar", icon: <LogOut className="h-4 w-4" />, danger: true, onClick: handleLogout },
          ]}
        />
      </div>

      <AddWorkspaceModal
        open={wsModal}
        onClose={() => setWsModal(false)}
        onCreate={(data) => {
          addWorkspace(data);
          setWsModal(false);
          nav("/app/dashboard");
        }}
      />
      <AddProjectModal
        open={projectModal}
        onClose={() => setProjectModal(false)}
        onCreate={(data) => {
          if (!activeWorkspace) return;
          const p = addProject({ ...data, workspaceId: activeWorkspace.id });
          setProjectModal(false);
          nav(`/app/projects/${p.id}`);
        }}
      />
    </aside>
  );
}

function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-brand-600 text-white shadow-soft"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

// ---------------------------------------------------------------
// Modal: Tambah Workspace
// ---------------------------------------------------------------
function AddWorkspaceModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; type: WorkspaceType; color: string }) => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<WorkspaceType>("personal");
  const [color, setColor] = useState(COLOR_PRESETS[0]);

  const submit = () => {
    if (!name.trim()) return;
    onCreate({ name: name.trim(), type, color });
    setName("");
    setType("personal");
    setColor(COLOR_PRESETS[0]);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tambah Workspace"
      description="Pisahkan pekerjaan pribadi dan perusahaan."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={submit} disabled={!name.trim()}>
            Buat Workspace
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label="Nama Workspace" placeholder="cth. PT Sinar Teknologi" value={name} onChange={(e) => setName(e.target.value)} />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Tipe</label>
          <div className="grid grid-cols-2 gap-2">
            {([
              { v: "personal", label: "Pribadi", icon: <UserRound className="h-4 w-4" /> },
              { v: "company", label: "Perusahaan", icon: <Building2 className="h-4 w-4" /> },
            ] as const).map((o) => (
              <button
                key={o.v}
                onClick={() => setType(o.v)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                  type === o.v
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-slate-300 text-slate-600 hover:bg-slate-50"
                )}
              >
                {o.icon}
                {o.label}
              </button>
            ))}
          </div>
        </div>
        <ColorPicker value={color} onChange={setColor} />
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------
// Modal: Tambah Project
// ---------------------------------------------------------------
function AddProjectModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; description: string; icon: string; color: string }) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState(PROJECT_ICONS[0]);
  const [color, setColor] = useState(COLOR_PRESETS[0]);

  const submit = () => {
    if (!name.trim()) return;
    onCreate({ name: name.trim(), description: description.trim(), icon, color });
    setName("");
    setDescription("");
    setIcon(PROJECT_ICONS[0]);
    setColor(COLOR_PRESETS[0]);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tambah Project"
      description="Project mengelompokkan task-task terkait."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={submit} disabled={!name.trim()}>
            Buat Project
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Ikon</label>
            <Dropdown
              trigger={
                <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-xl">
                  {icon}
                </span>
              }
              items={PROJECT_ICONS.map((ic) => ({
                label: ic,
                onClick: () => setIcon(ic),
              }))}
              className="[&_button]:grid"
            />
          </div>
          <div className="flex-1">
            <Input label="Nama Project" placeholder="cth. Dashboard Analitik" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        </div>
        <Textarea label="Deskripsi (opsional)" rows={2} placeholder="Tujuan project ini…" value={description} onChange={(e) => setDescription(e.target.value)} />
        <ColorPicker label="Warna" value={color} onChange={setColor} />
      </div>
    </Modal>
  );
}

function ColorPicker({
  value,
  onChange,
  label = "Warna aksen",
}: {
  value: string;
  onChange: (c: string) => void;
  label?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <div className="flex flex-wrap gap-2">
        {COLOR_PRESETS.map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg transition-transform hover:scale-110",
              value === c && "ring-2 ring-offset-2"
            )}
            style={{ backgroundColor: c, boxShadow: value === c ? `0 0 0 2px ${c}` : undefined }}
          >
            {value === c && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
          </button>
        ))}
      </div>
    </div>
  );
}
