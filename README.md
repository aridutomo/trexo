# Trexo 🦖

Sistem manajemen pekerjaan — Workspace, Project, Task (Kanban), progress otomatis, reporting + export Excel.

## Struktur (monorepo)

```
trexo/
├─ backend/    # Golang (Gin) + MySQL 8 — REST API. Lihat backend/README.md
└─ frontend/   # Next.js (App Router) + Tailwind + better-auth. Lihat frontend/README.md
```

## Arsitektur

```
Browser → frontend (Next.js :3000, better-auth) → /api/v1/* BFF → backend (Go :8080) → MySQL
```

- **better-auth** (frontend) konek langsung ke MySQL lewat `mysql2`.
- **BFF** (`frontend/src/app/api/v1/[...path]`) meneruskan request ke Go dengan header `X-Session-Token`.
- **backend Go** memverifikasi token di tabel `session` (better-auth) pada MySQL yang sama, lalu CRUD pada tabel bisnis (`ms_workspace`, `ms_project`, `ms_task`, `tr_task_step`, `tr_comment`).

## Menjalankan (lokal)

```bash
# 1. Backend (MySQL + Go API)
cd backend
cp .env.example .env          # set MYSQL_ROOT_PASSWORD dan MYSQL_PASSWORD
docker compose up -d --build  # MySQL :3306, Go :8080 (default)

# 2. Tabel better-auth (sekali)
cd ../frontend
npm install
npx @better-auth/cli migrate --config src/lib/auth.ts   # DATABASE_URL ada di frontend/.env.local

# 3. Frontend
npm run dev                  # http://localhost:3000
```

Login demo: sign-up email apa pun + password ≥ 8 karakter.

Detail tiap komponen ada di `backend/README.md` dan `frontend/README.md`.
