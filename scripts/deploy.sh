#!/bin/bash
# Deployment script untuk Trexo
# Dijalankan di server oleh Jenkins atau manual

set -e  # Exit on error

# Colors untuk output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="trexo"
DEPLOY_PATH="/opt/projects/${PROJECT_NAME}"
DOMAIN="trexo.anaki.id"
BACKUP_DIR="/opt/backups/${PROJECT_NAME}"
LOG_FILE="/var/log/${PROJECT_NAME}-deploy.log"

# Function untuk log
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE" >&2
}

# Function untuk backup
backup_current() {
    log "📦 Membuat backup..."

    mkdir -p "$BACKUP_DIR"

    # Backup database
    docker exec mysql-server mysqldump \
        -u root \
        -p"${MYSQL_ROOT_PASSWORD}" \
        trexo > "${BACKUP_DIR}/db-$(date +%Y%m%d-%H%M%S).sql" 2>/dev/null || true

    # Backup running containers config
    docker ps --format "{{.Names}}:{{.Image}}" > "${BACKUP_DIR}/containers-$(date +%Y%m%d-%H%M%S).txt"

    log "✅ Backup selesai"
}

# Function untuk rollback
rollback() {
    log "🔄 Melakukan rollback..."

    cd "$DEPLOY_PATH"
    docker compose down
    docker compose up -d

    log "✅ Rollback selesai"
    exit 1
}

# Main deployment
main() {
    log "🚀 Memulai deployment ${PROJECT_NAME}..."

    # Check apakah di directory yang benar
    if [ ! -d "$DEPLOY_PATH" ]; then
        error "Directory ${DEPLOY_PATH} tidak ditemukan!"
        exit 1
    fi

    cd "$DEPLOY_PATH"

    # Backup sebelum deploy
    backup_current

    # Pull latest changes jika ada git repo
    if [ -d ".git" ]; then
        log "📥 Pulling latest changes..."
        git pull origin main || log "⚠️ Git pull failed, continuing..."
    fi

    # Build dan deploy
    log "🔨 Building dan deploying..."
    docker compose down
    docker compose up -d --build

    # Wait untuk startup
    log "⏳ Menunggu aplikasi startup..."
    sleep 15

    # Health check
    log "🏥 Health check..."

    # Check backend
    for i in {1..10}; do
        if curl -f http://localhost:8080/healthz 2>/dev/null; then
            log "✅ Backend healthy!"
            break
        fi
        if [ $i -eq 10 ]; then
            error "Backend health check failed!"
            rollback
        fi
        sleep 3
    done

    # Check frontend
    if curl -f "https://${DOMAIN}" 2>/dev/null; then
        log "✅ Frontend healthy!"
    else
        error "Frontend health check failed!"
        rollback
    fi

    # Cleanup
    log "🧹 Cleanup old images..."
    docker image prune -f

    log "✅ Deployment selesai! Aplikasi running di https://${DOMAIN}"
}

# Run main function
main "$@"
