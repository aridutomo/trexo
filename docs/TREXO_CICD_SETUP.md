# 📘 Setup CI/CD Trexo dengan Jenkins

Panduan lengkap setup CI/CD untuk project Trexo menggunakan Jenkins di VPS dan trigger dari laptop.

---

## 📋 Langkah-langkah Setup

### 1. Setup Jenkins di VPS (Docker Container)

Jika Jenkins sudah running di Docker, cek konfigurasinya:

```bash
# Cek container Jenkins
docker ps | grep jenkins

# Masuk ke container Jenkins (jika perlu)
docker exec -it jenkins-container bash
```

Pastikan Jenkins bisa akses ke directory project:
```bash
# Jenkins harus bisa akses /opt/projects/trexo
ls -la /opt/projects/trexo
```

### 2. Setup Jenkins Job

1. **Buka Jenkins Dashboard**
   - Buka browser: `http://your-vps-ip:8080`
   - Login dengan akun admin

2. **Buat Job Baru**
   - Klik "New Item"
   - Nama: `trexo`
   - Tipe: "Pipeline"

3. **Konfigurasi Pipeline**
   - Scroll ke "Pipeline" section
   - Definition: `Pipeline script from SCM`
   - SCM: `Git`
   - Repository URL: `https://github.com/username/trexo.git` (atau path lokal)
   - Script Path: `Jenkinsfile`

   ATAU gunakan "Pipeline script" dan paste isi Jenkinsfile langsung.

4. **Save Job**

### 3. Setup Jenkins Credentials (Wajib!)

Untuk API token agar laptop bisa trigger Jenkins:

1. **Login ke Jenkins** → Klik username (pojok kanan atas)
2. **Configure** → Scroll ke "API Token"
3. **Add new Token** → Beri nama (misal: `laptop-deploy`)
4. **Generate** → **Copy token yang muncul** (hanya muncul sekali!)

### 4. Setup di Laptop

#### A. Copy publish script ke laptop:

```bash
# Di laptop, copy file ini dari server:
scp user@vps-ip:/home/aridutomo/publish_trexo.py ./
```

#### B. Buat .env file:

```bash
# Buat .env dari template (template ada di tools/.env.example)
cp tools/.env.example .env

# Edit .env dengan konfigurasi yang benar:
nano .env
```

Isi `.env`:
```env
JENKINS_URL=http://your-vps-ip:8080
JENKINS_USER=admin
JENKINS_TOKEN=token-dari-langkah-3
```

> ⚠️ **Penting:** Jangan pernah hardcode token langsung di `publish_trexo.py` dan
> jangan commit file `.env`. File `.env` sudah di-ignore oleh `.gitignore`.

#### C. Install dependencies (jika belum):

```bash
pip install requests
# Atau
pip3 install requests
```

### 5. Gunakan Script Publish

#### Test koneksi:
```bash
python publish_trexo.py --test
```

#### Deploy/Trigger Jenkins:
```bash
# Cara 1: Trigger saja (cepat)
python publish_trexo.py

# Cara 2: Trigger + tunggu selesai + lihat progress
python publish_trexo.py --wait

# Cara 3: Cek status build terakhir
python publish_trexo.py --status
```

---

## 🔧 File yang Ditambahkan di Project Trexo

Setelah setup, project trexo akan memiliki file tambahan:

```
trexo/
├── Jenkinsfile           # Pipeline definition untuk Jenkins
├── scripts/
│   └── deploy.sh         # Script deployment manual (opsional)
└── ... (file lain tetap sama)
```

---

## 🔄 Flow CI/CD

```
Laptop Anda                    VPS (Jenkins)                VPS (Production)
     │                              │                             │
     │  publish_trexo.py           │                             │
     │────────────────────────────>│                             │
     │  (HTTP POST trigger)        │                             │
     │                              │                             │
     │                              │  docker build backend      │
     │                              │────────────────────────────>│
     │                              │  docker build frontend     │
     │                              │────────────────────────────>│
     │                              │                             │
     │                              │  docker compose up -d       │
     │                              │────────────────────────────>│
     │                              │                             │
     │                              │  health check              │
     │                              │<────────────────────────────│
     │                              │                             │
     │  Build status                │                             │
     │<─────────────────────────────│                             │
     │                              │                             │
     ▼                              ▼                             ▼
```

---

## 🛠️ Troubleshooting

### Error: "Connection failed"
- Pastikan Jenkins running di VPS: `docker ps | grep jenkins`
- Cek firewall: `sudo ufw allow 8080` (atau port Jenkins)
- Cek JENKINS_URL di .env - harus full URL dengan http:// atau https://

### Error: "401 Unauthorized"
- Cek JENKINS_USER dan JENKINS_TOKEN di .env
- Pastikan token benar-benar dari step "Add new Token"

### Error: "404 Not Found" saat trigger
- Pastikan nama job di Jenkins sama dengan `JOB_NAME` di script
- Default job name: `trexo`

### Build gagal di Jenkins
- Cek Jenkins console output
- Pastikan Docker running di VPS: `docker ps`
- Pastikan user Jenkins bisa akses `/opt/projects/trexo`

### Permission denied untuk deploy.sh
```bash
# Di VPS, beri permission execute
chmod +x /opt/projects/trexo/scripts/deploy.sh
```

---

## 📝 Environment Variables di VPS

Jenkins memerlukan environment variables untuk deployment. Setup di Jenkins:

1. **Jenkins Dashboard → Manage Jenkins → Credentials**
2. **Add Credentials** untuk:
   - `MYSQL_ROOT_PASSWORD`: MySQL password
   - `BETTER_AUTH_SECRET`: Secret untuk better-auth
   - `GO_API_KEY`: API key untuk backend

Atau set langsung di docker-compose.yml atau .env file di VPS.

---

## 🚀 Deploy Manual (Tanpa Jenkins)

Jika ingin deploy manual tanpa Jenkins:

```bash
# SSH ke VPS
ssh user@vps-ip

# Navigate ke project
cd /opt/projects/trexo

# Pull latest changes (jika ada git)
git pull origin main

# Deploy dengan script
bash scripts/deploy.sh

# Atau langsung dengan docker compose
docker compose up -d --build
```

---

## ✅ Checklist Setup

- [ ] Jenkins running di Docker di VPS
- [ ] Jenkins job "trexo" sudah dibuat
- [ ] Jenkinsfile ada di root project trexo
- [ ] API token sudah dibuat dan dicopy
- [ ] publish_trexo.py ada di laptop
- [ ] .env file di laptop sudah diisi dengan konfigurasi yang benar
- [ ] Test koneksi berhasil (`--test`)
- [ ] Pertama deploy berhasil

---

## 📞 Commands Quick Reference

| Command | Deskripsi |
|---------|-----------|
| `python publish_trexo.py --test` | Test koneksi ke Jenkins |
| `python publish_trexo.py --status` | Cek status build terakhir |
| `python publish_trexo.py` | Trigger deploy (cepat) |
| `python publish_trexo.py --wait` | Trigger + tunggu + lihat progress |

Happy Deploying! 🚀
