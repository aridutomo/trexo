# Trexo CI/CD Pipeline untuk Jenkins
# Pipeline ini akan: build → test → deploy → health check

pipeline {
    agent any

    environment {
        // Konfigurasi Project
        PROJECT_NAME = 'trexo'
        DEPLOY_PATH = '/opt/projects/trexo'
        DOMAIN = 'trexo.anaki.id'

        // Docker images
        BACKEND_IMAGE = "trexo-backend:${BUILD_NUMBER}"
        FRONTEND_IMAGE = "trexo-frontend:${BUILD_NUMBER}"

        // Environment variables dari credentials Jenkins (nanti di-setup)
        // MYSQL_ROOT_PASSWORD = credentials('mysql-root-password')
        // BETTER_AUTH_SECRET = credentials('better-auth-secret')
        // GO_API_KEY = credentials('go-api-key')
    }

    options {
        // Keep last 10 builds
        buildDiscarder(logRotator(numToKeepStr: '10'))
        // Timeout 30 minutes
        timeout(time: 30, unit: 'MINUTES')
    }

    stages {
        stage('Prepare') {
            steps {
                echo "🚀 Memulai deployment ${PROJECT_NAME}#${BUILD_NUMBER}"
                sh '''
                    echo "Working directory: ${PWD}"
                    git clean -fd
                '''
            }
        }

        stage('Build Backend') {
            steps {
                echo "🔨 Building Backend (Go)..."
                sh """
                    cd backend
                    docker build \
                        --build-arg GO_ENV=production \
                        -t ${BACKEND_IMAGE} \
                        -t trexo-backend:latest \
                        .
                """
            }
        }

        stage('Build Frontend') {
            steps {
                echo "🎨 Building Frontend (Next.js)..."
                sh """
                    cd frontend
                    docker build \
                        --build-arg NODE_ENV=production \
                        -t ${FRONTEND_IMAGE} \
                        -t trexo-frontend:latest \
                        .
                """
            }
        }

        stage('Pre-Deployment Backup') {
            steps {
                echo "💾 Backup sebelum deployment..."
                sh """
                    # Backup containers (optional)
                    cd ${DEPLOY_PATH}
                    docker compose ps > /tmp/trexo-pre-deploy-${BUILD_NUMBER}.txt

                    # Tag current images as rollback
                    docker tag trexo-backend:latest trexo-backend:rollback || true
                    docker tag trexo-frontend:latest trexo-frontend:rollback || true
                """
            }
        }

        stage('Deploy') {
            steps {
                echo "🚀 Deploying ke production..."
                sh """
                    cd ${DEPLOY_PATH}

                    # Stop existing containers
                    docker compose down || true

                    # Start new containers
                    docker compose up -d

                    # Wait untuk startup
                    sleep 15
                """
            }
        }

        stage('Database Migration') {
            steps {
                echo "🗄️ Running database migrations (if needed)..."
                sh """
                    # Migrations sudah di-handle oleh backend (RUN_MIGRATIONS=true)
                    # Tambahkan command manual jika diperlukan
                    cd backend
                    # docker run --rm trexo-backend:latest ./trexo migrate
                """
            }
        }

        stage('Health Check') {
            steps {
                echo "🏥 Memeriksa kesehatan aplikasi..."
                sh """
                    # Check backend health
                    echo "Checking Backend..."
                    MAX_ATTEMPTS=10
                    ATTEMPT=0

                    while [ \$ATTEMPT -lt \$MAX_ATTEMPTS ]; do
                        if curl -f http://localhost:8080/healthz; then
                            echo "✅ Backend healthy!"
                            break
                        fi
                        ATTEMPT=\$((ATTEMPT + 1))
                        echo "Attempt \$ATTEMPT failed, waiting..."
                        sleep 5
                    done

                    if [ \$ATTEMPT -eq \$MAX_ATTEMPTS ]; then
                        echo "❌ Backend health check failed!"
                        exit 1
                    fi

                    # Check frontend
                    echo "Checking Frontend..."
                    if ! curl -f https://${DOMAIN}; then
                        echo "❌ Frontend health check failed!"
                        exit 1
                    fi

                    echo "✅ Frontend healthy!"

                    # Check running containers
                    docker compose ps
                """
            }
        }

        stage('Cleanup') {
            steps {
                echo "🧹 Membersihkan resources lama..."
                sh """
                    # Hapus docker images tidak terpakai
                    docker image prune -f

                    # Hapus build lama (> 7 hari)
                    find /tmp/trexo-pre-deploy-*.txt -mtime +7 -delete 2>/dev/null || true
                """
            }
        }
    }

    post {
        success {
            echo "✅✅✅ Deployment Berhasil! ✅✅✅"
            echo "🌐 Aplikasi running di: https://${DOMAIN}"
            sh """
                # Notifikasi sukses (bisa ditambahkan ke Slack/Telegram)
                echo "Deployment ${BUILD_NUMBER} berhasil at \$(date)" >> /var/log/jenkins-deploy.log
            """
        }

        failure {
            echo "❌❌❌ Deployment Gagal! ❌❌❌"
            sh """
                # Rollback ke versi sebelumnya
                cd ${DEPLOY_PATH}
                docker compose down
                docker compose up -d

                echo "Rollback completed at \$(date)" >> /var/log/jenkins-deploy-error.log
            """
        }

        always {
            // Cleanup workspace
            cleanWs()
        }
    }
}
