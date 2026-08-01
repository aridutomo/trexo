# Trexo 🦖

Sistem manajemen pekerjaan modern — pisahkan pekerjaan **pribadi** & **perusahaan** dalam Workspace, kelola Project & Task dengan **Kanban drag-and-drop**, **progress otomatis**, dan **reporting + export Excel**.

> Status: **Frontend-first** dengan mock data layer. Backend (DB + API + NextAuth) tinggal disambung nanti.

## ✨ Fitur

| # | Fitur | Status |
|---|-------|--------|
| 1 | Workspace (Pribadi / Perusahaan) — multi-workspace + switcher | ✅ |
| 2 | Project per workspace | ✅ |
| 3 | Task + kategorisasi Sumber Ide & Tingkat Kesulitan | ✅ |
| 4 | Task Steps (checklist) | ✅ |
| 5 | **Progress otomatis**: `(steps selesai / total) × 100`; tanpa steps → ikut status Kanban | ✅ |
| 6 | Login modern (mock auth + tombol Google) | ✅ |
| 7 | View **List** (search + sort) & **Kanban** (drag-drop real-time) | ✅ |
| 8 | **Report**: filter, grafik, HTML preview, **Export Excel (.xlsx)** | ✅ |

Bonus: Dashboard ringkasan + grafik (Chart.js), komentar per task, global search, data persist di `localStorage`.

## 🧱 Tech Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS 3** — komponen UI custom (tanpa shadcn)
- **Zustand** (+ persist) — state & mock API layer
- **@hello-pangea/dnd** — Kanban drag-and-drop
- **Chart.js** (react-chartjs-2) — grafik
- **SheetJS (xlsx)** — export Excel dari browser

## 🚀 Menjalankan

```bash
npm install
npm run dev        # http://localhost:3000
```

**Login demo:** klik **"Masuk dengan Google"** (atau email apa pun + password ≥ 4 karakter).

Atur ulang data kapan saja lewat menu user → **Reset Data Demo**.

## 📁 Struktur

```
src/
├─ app/
│  ├─ login/                     # Halaman login
│  ├─ app/                       # Area terautentikasi (AppShell)
│  │  ├─ dashboard/              # Ringkasan + grafik
│  │  ├─ projects/[projectId]/   # List & Kanban
│  │  ├─ tasks/[taskId]/         # Detail: steps, progress, komentar
│  │  ├─ report/                 # Filter + export Excel
│  │  └─ settings/
│  └─ page.tsx                   # Redirect (login/dashboard)
├─ components/
│  ├─ ui/                        # Primitif: Button, Modal, Select, Badge, dll
│  ├─ layout/                    # Sidebar, Topbar, AppShell
│  ├─ kanban/                    # KanbanBoard, KanbanCard
│  ├─ task/                      # AddTaskModal, TaskSteps, badges, dll
│  └─ dashboard/                 # StatCard, chart
└─ lib/
   ├─ store.ts                   # Zustand + persist (MOCK API layer)
   ├─ mock-data.ts               # Seed data
   ├─ types.ts                   # Skema domain (≈ struktur DB)
   ├─ utils.ts                   # cn, computeProgress, tanggal
   └─ export.ts                  # Export Excel + ringkasan report
```

## 🔌 Menyambung backend (nanti)

Mock layer ada di `src/lib/store.ts`. Untuk beralih ke backend asli, ganti body aksi (mis. `addTask`, `moveTask`) dengan pemanggilan API (`fetch`), dan ganti `seed-data` dengan hasil fetch awal. Tipe domain di `types.ts` sudah meniru skema DB (User, Workspace, Project, Task, TaskStep, Comment).

```bash
npm run build     # type-check + production build
npm run start     # jalankan hasil build
```
