# Trexo Backend (Golang + MySQL)

REST API untuk Trexo. Next.js (better-auth) memanggil API ini lewat BFF proxy
dengan header `X-Session-Token`. Go memverifikasi token di tabel `session`
(better-auth) pada MySQL yang sama, lalu melakukan CRUD pada 5 tabel bisnis
(`ms_workspace`, `ms_project`, `ms_task`, `tr_task_step`, `tr_comment`).

## Stack
- **Gin** (router), **sqlx** (DB), **go-sql-driver/mysql**, **golang-migrate**
  (migrasi tertanam di binary, auto-apply saat startup).
- **MySQL 8** (`utf8mb4`, `DATETIME(3)`, `ENUM`, FK cascade/restrict).

## Struktur
```
cmd/server/main.go              wiring + graceful shutdown
db/                             pool + migrasi (embed migrations/*.sql)
internal/config                 env config
internal/auth                   verifikasi X-Session-Token
internal/domain                 DTO, AppError, ownership checks, GenID
internal/store                  data access (sqlx), 5 entity
internal/server                 router /api/v1/*
internal/http/{handler,middleware,respond}
```

## Menjalankan (Docker — cara utama)
```bash
cp .env.example .env
# edit .env: set MYSQL_ROOT_PASSWORD dan MYSQL_PASSWORD
docker compose up -d --build
# cek: curl http://localhost:8080/healthz  ->  {"status":"ok"}
```
Migrasi tabel bisnis dijalankan otomatis di startup (embedded). Tabel
better-auth (`user/session/account/verification`) dibuat dari sisi Next.js (lihat
bawah).

## Menjalankan (lokal tanpa Docker — untuk dev)
```bash
# butuh MySQL lokal di :3306 (atau pakai hanya service mysql dari compose):
docker compose up -d mysql
# multiStatements=true WAJIB agar golang-migrate bisa jalan file multi-statement
export DSN="trexo:<pass>@tcp(127.0.0.1:3306)/trexo?parseTime=true&loc=UTC&charset=utf8mb4&multiStatements=true"
go run ./cmd/server
```

> **Host port 8080 sibuk?** Override lewat env: `APP_PORT=8090 docker compose up`
> (default `8080`). Contoh jika port 8080 di-host dipakai aplikasi lain.
> di-compose DSN sudah memakai `multiStatements=true`; bila DSN diset manual
> (local dev / skrip migrasi) jangan lupa tambahkan parameter itu.

## Setup better-auth di MySQL yang sama (dari proyek Next.js)
1. Di proyek frontend, `src/lib/auth.ts` memakai mysql2. Set
   `DATABASE_URL=mysql://trexo:<pass>@<host>:3306/trexo`.
2. Jalankan sekali:
   ```bash
   npx @better-auth/cli migrate --config src/lib/auth.ts
   ```
3. Verifikasi nama kolom tabel session (penting untuk query Go):
   ```sql
   DESCRIBE session;
   -- better-auth memakai camelCase: token, userId, expiresAt, ...
   -- Query Go di internal/auth/session.go sudah sesuai camelCase.
   ```
   Pertahankan `BETTER_AUTH_SECRET` yang sama agar session lama tetap valid.

## Menambah / mengubah skema (mudah)
1. Buat file baru `db/migrations/000002_nama.up.sql` + `.down.sql`.
2. Rebuild: `docker compose up -d --build` (migrasi auto-apply saat startup).

## Endpoint (`/api/v1`, butuh `X-Session-Token`)
```
GET/POST /workspaces · PATCH/DELETE /workspaces/:id
GET/POST /workspaces/:id/projects · GET/PATCH/DELETE /projects/:id
GET/POST /projects/:id/tasks · GET/PATCH/DELETE /tasks/:id
POST /tasks/:id/steps · PATCH/DELETE /steps/:id · PATCH /steps/:id/toggle
PUT  /tasks/:id/steps/reorder
GET/POST /tasks/:id/comments · DELETE /comments/:id
```
Error: HTTP status + `{"error":{"code","message"}}`, kode
`UNAUTH|FORBIDDEN|NOT_FOUND|VALIDATION|INTERNAL`.

## TLS di VPS (penting)
Karena `X-Session-Token` lewat internet, pakai HTTPS. Letakkan Caddy/Cloudflare
Tunnel di depan port 8080. Contoh Caddy:
```
api.trexo.example {
  reverse_proxy localhost:8080
}
```
Set `GO_API_URL=https://api.trexo.example` di frontend (Vercel).
