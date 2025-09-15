#!/bin/bash

# AI IDE Complete Backup Script
# Orchestrates database and files backup

set -e

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" >&2
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO:${NC} $1"
}

# Function to send notification (webhook/email)
send_notification() {
    local status=$1
    local message=$2

    # Send to webhook if configured
    if [ -n "$BACKUP_WEBHOOK_URL" ]; then
        curl -X POST "$BACKUP_WEBHOOK_URL" \
             -H "Content-Type: application/json" \
             -d "{\"status\":\"$status\",\"message\":\"$message\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" \
             >/dev/null 2>&1 || warn "Failed to send webhook notification"
    fi
}

log "=== AI IDE Complete Backup Started ==="

# Load environment variables if available
if [ -f "$SCRIPT_DIR/../../.env.production" ]; then
    set -o allexport
    source "$SCRIPT_DIR/../../.env.production"
    set +o allexport
fi

START_TIME=$(date +%s)

# Run database backup
info "Starting database backup..."
if bash "$SCRIPT_DIR/backup-database.sh"; then
    log "Database backup completed successfully"
    DB_BACKUP_STATUS="SUCCESS"
else
    error "Database backup failed"
    DB_BACKUP_STATUS="FAILED"
fi

# Run files backup
info "Starting files backup..."
if bash "$SCRIPT_DIR/backup-files.sh"; then
    log "Files backup completed successfully"
    FILES_BACKUP_STATUS="SUCCESS"
else
    error "Files backup failed"
    FILES_BACKUP_STATUS="FAILED"
fi

# Calculate total time
END_TIME=$(date +%s)
TOTAL_TIME=$((END_TIME - START_TIME))
FORMATTED_TIME=$(printf '%02d:%02d:%02d' $((TOTAL_TIME/3600)) $((TOTAL_TIME%3600/60)) $((TOTAL_TIME%60)))

# Summary
log "=== Backup Summary ==="
log "Database backup: $DB_BACKUP_STATUS"
log "Files backup: $FILES_BACKUP_STATUS"
log "Total time: $FORMATTED_TIME"

# Overall status
if [ "$DB_BACKUP_STATUS" = "SUCCESS" ] && [ "$FILES_BACKUP_STATUS" = "SUCCESS" ]; then
    OVERALL_STATUS="SUCCESS"
    log "=== All backups completed successfully! ==="
    send_notification "success" "AI IDE backup completed successfully in $FORMATTED_TIME"
    exit 0
else
    OVERALL_STATUS="PARTIAL_FAILURE"
    warn "=== Backup completed with errors ==="
    send_notification "warning" "AI IDE backup completed with errors: DB=$DB_BACKUP_STATUS, Files=$FILES_BACKUP_STATUS"
    exit 1
fi