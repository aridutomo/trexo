# Menjalankan Lokal Mengarah ke Database Staging / Production (VPS)

Menjalankan full-stack Trexo (frontend Next.js + backend Go) secara **native** di laptop (`go run` + `yarn dev`), tetapi database-nya adalah **staging** (`trexo_stg`) atau **production** (`trexo`) yang berada di **VPS** — bukan DB docker lokal.

Database staging/production ada di container `mysql-server` pada VPS `kawali` (`103.93.135.76`), dan diakses dari laptop lewat **SSH tunnel** pada `127.0.0.1:3306`.

---

## TL;DR — Apa yang harus saya jalankan?

> Setiap kali setup awal sudah selesai (lihat **Setup sekali**), untuk **menjalankan staging** di satu sesi Anda cukup:
>
> 1. Bebaskan port 3306: `docker compose down` di `backend/`.
> 2. Buka SSH tunnel (biarkan terbuka di terminalnya sendiri):
>    ```bash
>    ssh -o ExitOnForwardFailure=yes -o ServerAliveInterval=30 -L 127.0.0.1:3306:127.0.0.1:3306 -N kawali
>    ```
> 3. Pilih environment: `./switch-env.sh stg`
> 4. Jalankan kedua app:
>    ```bash
>    (cd backend  && go run ./cmd/server)   # Go API di :8080
>    (cd frontend && yarn dev)               # Next.js di :3000
>    ```
>
> Buka **http://localhost:3000**.

Jadi, **ya — setelah tunnel up & env ter-switch, Anda hanya menjalankan backend dan frontend.** Tunnel dan `switch-env` adalah prasyarat sekali per sesi, bukan langkah yang diulang setiap kali restart app dalam sesi yang sama.

---

## Topologi

```
Browser → frontend (Next.js :3000, better-auth) ──DATABASE_URL──┐
                                   │                             │
                                   └─ /api/v1/* BFF → Go :8080 ──DSN──┐
                                                                     │
   laptop (native)                                                   ▼
   127.0.0.1:3306  ◄═══ SSH tunnel (-L 3306:127.0.0.1:3306) ═════►  VPS kawali (socat :3306 → mysql-server)
                                                                         └─ DB: trexo (prod), trexo_stg (stg)
```

- **better-auth** (frontend) menulis session ke tabel `session` via `DATABASE_URL`.
- **BFF** meneruskan request ke Go dengan header `X-Session-Token`.
- **Go backend** memverifikasi token itu dengan membaca tabel `session` yang sama dari `DSN`-nya.

Karena itu **`DATABASE_URL` (frontend) dan `DSN` (backend) HARUS menunjuk database yang sama.** Kalau beda → login berhasil, tapi **semua panggilan API `401 Unauthorized`**. Itulah sebabnya ada `switch-env.sh` yang mengganti kedua sisi sekaligus.

---

## Prasyarat

- Akses SSH ke VPS: host `kawali` sudah didefinisikan di `~/.ssh/config`
  (`HostName 103.93.135.76`, `User aridutomo`, `IdentityFile ~/.ssh/kawalikey.pem`).
  > Catatan: host `my-vps` (`srv1206670.hstgr.cloud`) di config **sudah tidak valid** (DNS non-existent). Gunakan `kawali`.
- **Go 1.23+** dan **Node 22+ / yarn** terpasang di laptop.
- Container `mysql-server` di VPS berjalan (sudah default up). Tidak perlu docker MySQL lokal.

---

## Setup sekali (one-time)

`switch-env.sh` menyalin template per-environment ke file runtime aktif (`backend/.env.local` & `frontend/.env.local`). Template berisi password asli VPS → **gitignored**.

Template berikut sudah berisi nilai asli di repo lokal ini:

| File | Isi | Status git |
|---|---|---|
| `backend/.env.staging`, `backend/.env.production` | DSN + config Go per env (password root VPS) | gitignored |
| `frontend/.env.staging`, `frontend/.env.production` | `DATABASE_URL` + config Next.js per env (password root VPS) | gitignored |

**Mesin baru / anggota tim** — copy dari `.example`, lalu isi password root `mysql-server` di VPS:

```bash
cp backend/.env.staging.example    backend/.env.staging
cp backend/.env.production.example backend/.env.production
cp frontend/.env.staging.example    frontend/.env.staging
cp frontend/.env.production.example frontend/.env.production
# edit tiap file: ganti <MYSQL_ROOT_PASSWORD> dgn password root mysql-server di VPS,
# dan <random-32-byte-base64-string> di frontend dgn BETTER_AUTH_SECRET (generate:
#   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))" )
```

Verifikasi koneksi & DB sebelum mulai (opsional tapi disarankan):

```bash
# cek apakah password benar & DB ada di VPS
PW=$(grep -E '^DSN=' backend/.env.staging | sed -E 's#^DSN=root:([^@]+)@.*#\1#')
ssh kawali "docker exec -e MYSQL_PWD='$PW' mysql-server mysql -uroot -N -e 'SHOW DATABASES;'"
# harus mencantumkan: trexo  dan  trexo_stg
```

---

## Workflow utama (per sesi)

```bash
# 1. Bebaskan port 3306 dari stack docker lokal (sekali per sesi native)
cd backend && docker compose down && cd ..

# 2. Buka SSH tunnel (jalankan di terminal terpisah, biarkan tetap terbuka)
ssh -o ExitOnForwardFailure=yes -o ServerAliveInterval=30 -L 127.0.0.1:3306:127.0.0.1:3306 -N kawali

# 3. Pilih environment — backend + frontend terswitch sekaligus
./switch-env.sh stg        # → trexo_stg   (default untuk dev)
# atau
./switch-env.sh prod       # → trexo

# 4. Jalankan kedua app
(cd backend  && go run ./cmd/server)   # Go API di :8080
(cd frontend && yarn dev)               # Next.js di :3000
```

Buka `http://localhost:3000`. Saat Go start, migrasi (idempoten) otomatis dijalankan ke database terpilih.

> Dalam **sesi yang sama**, bila Anda hanya mengubah kode dan restart, Anda **tidak perlu** mengulang tunnel/switch — cukup jalankan ulang `go run`/`yarn dev`. Tunnel dan `.env.local` tetap.

---

## Berganti antara staging dan production

```bash
# staging → production
./switch-env.sh prod
# lalu restart kedua app (Ctrl+C di go run & yarn dev, jalankan ulang)

# production → staging
./switch-env.sh stg
# lalu restart kedua app
```

**Wajib restart setelah switch.** File `.env.local` hanya dibaca saat startup — switch tanpa restart = app tetap memakai database lama.

---

## Cek environment yang sedang aktif

```bash
./switch-env.sh            # tanpa argumen
```

Contoh output:

```
Usage: ./switch-env.sh [stg|prod]
  stg   - staging (trexo_stg)      prod - production (trexo)

backend : trexo_stg
frontend: trexo_stg
```

---

## Gotcha: `schema_migrations` tidak sinkron

Gejala: backend exit saat startup dengan `Error 1050 (42S01): Table 'ms_workspace' already exists`.

Penyebab: database target sudah berisi semua tabel (v1–v4), tetapi tabel bookkeeping `schema_migrations` kosong/berisi versi lama, sehingga golang-migrate mencoba menjalankan migrasi dari awal dan bentrok dengan tabel yang sudah ada.

Fix (database staging/production di VPS — lossless, hanya memperbaiki bookkeeping):

```bash
PW=$(grep -E '^DSN=' backend/.env.local | sed -E 's#^DSN=root:([^@]+)@.*#\1#')
# set ke versi migrasi terkini (cek: ls backend/db/migrations | tail -1)
ssh kawali "docker exec -e MYSQL_PWD='$PW' mysql-server mysql -uroot \
  -e 'UPDATE schema_migrations SET version=4, dirty=0;' trexo_stg"
```

> `version=4` = versi migrasi tertinggi saat ini (lihat `backend/db/migrations`). Setara dengan `migrate force 4`.

---

## Kembali ke mode docker lokal (dev standar)

Mode native memakai tunnel pada port 3306 dan menimpa `frontend/.env.local`. Untuk kembali ke stack docker (lihat `README.md`):

```bash
# 1. Tutup SSH tunnel (Ctrl+C di terminal tunnel)
# 2. Nyalakan stack docker
cd backend && docker compose up -d --build    # MySQL :3306 + Go :8081
# 3. Di frontend, restore frontend/.env.local ke nilai docker:
#    DATABASE_URL=mysql://trexo:trexo-test@127.0.0.1:3306/trexo
#    GO_API_URL=http://localhost:8081
cd ../frontend && yarn dev
```

> Backend docker tidak perlu diapa-apakan — di dalam container tidak ada `.env.local`, jadi DSN tetap dari `docker-compose.yml` (godotenv no-op).

---

## Troubleshooting

| Gejala | Penyebab & solusi |
|---|---|
| `ssh: Could not resolve hostname ...` | Salah host SSH. VPS trexo = host **`kawali`**, bukan `my-vps` (sudah dead). |
| Tunnel exit langsung / port 3306 dipakai | Port 3306 masih dipegang docker lokal → `docker compose down` di `backend/`. Flag `ExitOnForwardFailure=yes` membuat tunnel langsung gagal (tidak nge-hang) bila 3306 sibuk. |
| `Access denied for user 'root'` | Password di `backend/.env.staging`/`.production` salah. Isi dengan password root `mysql-server` di VPS. |
| Backend: `Table 'ms_workspace' already exists` | `schema_migrations` tidak sinkron — lihat **Gotcha** di atas. |
| Login OK tapi semua API `401` | `DATABASE_URL` frontend ≠ `DSN` backend (beda database). Jalankan ulang `./switch-env.sh stg\|prod` lalu restart kedua app. |
| `bind: address already in use :8080` | Port 8080 dipakai proses lain (mis. container `app` docker). `docker compose down`; atau ubah `PORT` di `backend/.env.{staging,production}` **dan** `GO_API_URL` di frontend ke port lain (mis. `8082`) — keduanya harus sama. |
| Perubahan tidak berdampak setelah switch | Lupa restart — `.env.local` hanya dibaca saat startup. |

---

## Ringkasan file

| File | Fungsi | Commit? |
|---|---|---|
| `switch-env.sh` | Switch backend + frontend ke stg/prod sekaligus | ✅ committed |
| `backend/.env.staging` / `.production` | DSN + config Go per env (password root VPS) | ❌ gitignored |
| `frontend/.env.staging` / `.production` | `DATABASE_URL` + config Next.js per env (password root VPS) | ❌ gitignored |
| `backend/.env.local` / `frontend/.env.local` | Runtime aktif (ditulis oleh script) | ❌ gitignored |
| `*/.env.staging.example` / `.production.example` | Template placeholder | ✅ committed |
| `backend/db/migrations/*.up\|down.sql` | File migrasi golang-migrate | ✅ committed |
| `backend/internal/config/config.go` | Memuat `backend/.env.local` via godotenv saat startup (no-op bila tak ada, tak pernah timpa env asli) | ✅ committed |

> Frontend tidak perlu perubahan kode: Next.js otomatis memuat `.env.local`. Backend memuatnya lewat `godotenv` di `config.Load()`.
