#!/bin/bash

# AI IDE Files Backup Script
# Backs up uploaded files and user data with rotation

set -e

# Configuration
BACKUP_DIR="/backups/files"
UPLOAD_DIR="/app/uploads"
AI_MODELS_DIR="/app/models"
AI_CACHE_DIR="/app/cache"
LOGS_DIR="/app/logs"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="ai_ide_files_backup_${TIMESTAMP}.tar.gz"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

log "Starting files backup..."

# Check if directories exist
DIRS_TO_BACKUP=()
[ -d "$UPLOAD_DIR" ] && DIRS_TO_BACKUP+=("$UPLOAD_DIR")
[ -d "$AI_MODELS_DIR" ] && DIRS_TO_BACKUP+=("$AI_MODELS_DIR")
[ -d "$AI_CACHE_DIR" ] && DIRS_TO_BACKUP+=("$AI_CACHE_DIR")
[ -d "$LOGS_DIR" ] && DIRS_TO_BACKUP+=("$LOGS_DIR")

if [ ${#DIRS_TO_BACKUP[@]} -eq 0 ]; then
    warn "No directories found to backup"
    exit 0
fi

log "Directories to backup: ${DIRS_TO_BACKUP[*]}"

# Create backup archive
log "Creating backup archive: $BACKUP_FILE"
if tar -czf "$BACKUP_DIR/$BACKUP_FILE" "${DIRS_TO_BACKUP[@]}" 2>/dev/null; then
    log "Backup created successfully: $BACKUP_DIR/$BACKUP_FILE"

    # Calculate backup size
    BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
    log "Backup size: $BACKUP_SIZE"

    # Count files backed up
    FILE_COUNT=$(tar -tzf "$BACKUP_DIR/$BACKUP_FILE" | wc -l)
    log "Files backed up: $FILE_COUNT"

else
    error "Failed to create files backup"
    exit 1
fi

# Clean up old backups
log "Cleaning up backups older than $RETENTION_DAYS days..."
OLD_BACKUPS=$(find "$BACKUP_DIR" -name "ai_ide_files_backup_*.tar.gz" -mtime +$RETENTION_DAYS 2>/dev/null || true)

if [ -n "$OLD_BACKUPS" ]; then
    echo "$OLD_BACKUPS" | while read -r backup; do
        log "Removing old backup: $(basename "$backup")"
        rm -f "$backup"
    done
else
    log "No old backups to clean up"
fi

# Upload to S3 if configured
if [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ] && [ -n "$BACKUP_S3_BUCKET" ]; then
    log "Uploading backup to S3..."

    # Check if AWS CLI is available
    if command -v aws >/dev/null 2>&1; then
        S3_PATH="s3://$BACKUP_S3_BUCKET/files/$(basename "$BACKUP_FILE")"

        if aws s3 cp "$BACKUP_DIR/$BACKUP_FILE" "$S3_PATH"; then
            log "Backup uploaded to S3: $S3_PATH"
        else
            warn "Failed to upload backup to S3"
        fi
    else
        warn "AWS CLI not installed, skipping S3 upload"
    fi
fi

# Summary
TOTAL_BACKUPS=$(find "$BACKUP_DIR" -name "ai_ide_files_backup_*.tar.gz" | wc -l)
log "Files backup completed successfully!"
log "Total backups stored: $TOTAL_BACKUPS"
log "Backup location: $BACKUP_DIR/$BACKUP_FILE"

exit 0