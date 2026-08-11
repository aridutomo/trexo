# 📘 Langkah Selanjutnya - Setup CI/CD Trexo

Jenkins sudah terinstall ✅

Ikuti langkah ini satu per satu:

---

## STEP 1: Buka Jenkins di Browser

1. Buka browser (Chrome/Edge/Firefox)
2. Ketik: `http://103.93.135.76:8080`
3. Login dengan akun admin Jenkins Anda

---

## STEP 2: Buat Job "trexo" di Jenkins

1. Di dashboard Jenkins, klik **"New Item"**
2. **Item name:** ketik `trexo`
3. Pilih **"Pipeline"**
4. Klik **"OK"**

5. Di halaman konfigurasi:
   - Scroll ke bawah ke section **"Pipeline"**
   - **Definition:** pilih **"Pipeline script"**
   - **Script:** Copy dan paste kode di bawah ini:

```groovy
pipeline {
    agent any

    environment {
        PROJECT_NAME = 'trexo'
        DEPLOY_PATH = '/opt/projects/trexo'
        DOMAIN = 'trexo.anaki.id'
    }

    stages {
        stage('Deploy') {
            steps {
                sh """
                    cd ${DEPLOY_PATH}
                    docker compose down
                    docker compose up -d --build
                    sleep 15
                """
            }
        }

        stage('Health Check') {
            steps {
                sh """
                    curl -f http://localhost:8080/healthz || exit 1
                    curl -f https://${DOMAIN} || exit 1
                """
            }
        }
    }

    post {
        success {
            echo '✅ Deployment Berhasil!'
        }
        failure {
            echo '❌ Deployment Gagal!'
        }
    }
}
```

6. Klik **"Save"**

---

## STEP 3: Dapatkan API Token Jenkins

1. Di Jenkins, klik **username** Anda di pojok kanan atas
2. Klik **"Configure"**
3. Scroll ke section **"API Token"**
4. Klik **"Add new Token"**
5. **Token name:** ketik `laptop`
6. Klik **"Generate"**
7. **COPY token yang muncul!** (Hanya muncul sekali, simpan di notepad)

---

## STEP 4: Di Laptop Windows Anda

Buka PowerShell dan jalankan:

```powershell
# Masuk ke folder trexo yang sudah di-clone
cd trexo

# Masuk ke folder tools
cd tools

# Copy .env.example ke .env
copy .env.example .env

# Edit .env dengan notepad
notepad .env
```

Isi file `.env` dengan:

```env
JENKINS_URL=http://103.93.135.76:8080
JENKINS_USER=admin
JENKINS_TOKEN=paste-token-dari-step-3
```

Simpan dan tutup notepad.

---

## STEP 5: Install Dependency

Di PowerShell:

```powershell
pip install requests
```

---

## STEP 6: Test Koneksi

Di PowerShell (di folder tools):

```powershell
python publish_trexo.py --test
```

Jika sukses, akan muncul:
```
✅ Connection successful! Jenkins version: ...
```

---

## STEP 7: Deploy!

Di PowerShell (di folder tools):

```powershell
# Test deploy pertama
python publish_trexo.py

# Atau dengan melihat progress
python publish_trexo.py --wait
```

---

## SELESAI! 🎉

Setiap kali Anda mau deploy trexo:
```powershell
cd trexo\tools
python publish_trexo.py
```

---

**Butuh bantuan? Beritahu saya langkah mana yang bermasalah!**
