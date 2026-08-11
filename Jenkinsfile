# Trexo CI/CD Pipeline untuk Jenkins
#
# Pipeline ini bekerja di /opt/projects/trexo (kode yang sudah di-clone & di-mount
# ke container jenkins-server), BUKAN di workspace Jenkins yang kosong.
# Prasyarat di container jenkins-server:
#   - /opt/projects/trexo  ter-mount (sudah)
#   - docker socket + binary docker ter-mount (sudah)
#   - plugin docker compose terpasang di $DOCKER_CONFIG/cli-plugins (lihat docs/TREXO_CICD_SETUP.md)

pipeline {
    agent any

    environment {
        PROJECT_NAME = 'trexo'
        DEPLOY_PATH  = '/opt/projects/trexo'
        DOMAIN       = 'trexo.anaki.id'
        // Plugin compose dipasang di volume persisten; arahkan DOCKER_CONFIG ke sana
        // agar `docker compose` (v2) ditemukan di dalam container.
        DOCKER_CONFIG = '/var/jenkins_home/.docker'
    }

    options {
        // Simpan 10 build terakhir
        buildDiscarder(logRotator(numToKeepStr: '10'))
        // Timeout 30 menit
        timeout(time: 30, unit: 'MINUTES')
    }

    stages {
        stage('Prepare') {
            steps {
                echo "🚀 Memulai deployment ${PROJECT_NAME}#${BUILD_NUMBER}"
                sh '''
                    set -e
                    cd "${DEPLOY_PATH}"
                    echo "Working directory: $(pwd)"

                    # Ambil kode terbaru (best-effort).
                    # Bila SSH key container belum diset, git fetch akan gagal ->
                    # kita lanjut memakai kode yang sudah ada di DEPLOY_PATH.
                    if git fetch --all; then
                        git reset --hard origin/main
                        git clean -fd
                        echo "Kode di-update ke HEAD terbaru."
                    else
                        echo "⚠️  git fetch gagal (SSH key container belum diset?). Memakai kode yang ada di ${DEPLOY_PATH}."
                    fi
                '''
            }
        }

        stage('Deploy') {
            steps {
                echo "🔨 Build & deploy dengan docker compose..."
                sh '''
                    cd "${DEPLOY_PATH}"
                    # --build       : build ulang image backend & frontend (lihat docker-compose.yml)
                    # --wait        : tunggu sampai healthcheck backend lulus (fail build bila unhealthy)
                    # --remove-orphans : hapus container lama yang tidak ada di compose
                    # Tidak ada `down` dulu -> container lama tetap jalan sampai yang baru siap (no downtime).
                    docker compose up -d --build --wait --remove-orphans
                '''
            }
        }

        stage('Health Check') {
            steps {
                echo "🏥 Memeriksa kesehatan aplikasi..."
                sh '''
                    cd "${DEPLOY_PATH}"
                    # Backend dijamin healthy oleh `docker compose --wait` (healthcheck di docker-compose.yml).
                    # Cek frontend lewat URL publik:
                    if curl -fsS "https://${DOMAIN}" >/dev/null; then
                        echo "✅ Frontend healthy (https://${DOMAIN})"
                    else
                        echo "❌ Frontend tidak merespons di https://${DOMAIN}"
                        exit 1
                    fi
                    echo "Status container:"
                    docker compose ps
                '''
            }
        }
    }

    post {
        success {
            echo "✅✅✅ Deployment ${BUILD_NUMBER} Berhasil! ✅✅✅"
            echo "🌐 Aplikasi running di: https://${DOMAIN}"
        }
        failure {
            // JANGAN `docker compose down` di sini — biarkan app yang sedang jalan tetap up.
            echo "❌❌❌ Deployment ${BUILD_NUMBER} Gagal. Cek log build. App yang berjalan TIDAK dihentikan."
        }
        always {
            echo "Pipeline selesai."
        }
    }
}
