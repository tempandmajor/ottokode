#!/bin/bash

# AI IDE Database Backup Script
# Backs up PostgreSQL database with rotation

set -e

# Configuration
BACKUP_DIR="/backups/database"
CONTAINER_NAME="ai-ide-postgres-1"
DB_NAME="ai_ide"
DB_USER="ai_ide_user"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="ai_ide_backup_${TIMESTAMP}.sql"

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

log "Starting database backup..."

# Check if Docker container is running
if ! docker ps --format "table {{.Names}}" | grep -q "$CONTAINER_NAME"; then
    error "PostgreSQL container '$CONTAINER_NAME' is not running"
    exit 1
fi

# Create backup
log "Creating backup: $BACKUP_FILE"
if docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" --no-password > "$BACKUP_DIR/$BACKUP_FILE"; then
    log "Backup created successfully: $BACKUP_DIR/$BACKUP_FILE"

    # Compress backup
    log "Compressing backup..."
    gzip "$BACKUP_DIR/$BACKUP_FILE"
    log "Backup compressed: $BACKUP_DIR/${BACKUP_FILE}.gz"

    # Calculate backup size
    BACKUP_SIZE=$(du -h "$BACKUP_DIR/${BACKUP_FILE}.gz" | cut -f1)
    log "Backup size: $BACKUP_SIZE"

else
    error "Failed to create database backup"
    exit 1
fi

# Clean up old backups
log "Cleaning up backups older than $RETENTION_DAYS days..."
OLD_BACKUPS=$(find "$BACKUP_DIR" -name "ai_ide_backup_*.sql.gz" -mtime +$RETENTION_DAYS 2>/dev/null || true)

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
        S3_PATH="s3://$BACKUP_S3_BUCKET/database/$(basename "${BACKUP_FILE}.gz")"

        if aws s3 cp "$BACKUP_DIR/${BACKUP_FILE}.gz" "$S3_PATH"; then
            log "Backup uploaded to S3: $S3_PATH"
        else
            warn "Failed to upload backup to S3"
        fi
    else
        warn "AWS CLI not installed, skipping S3 upload"
    fi
fi

# Summary
TOTAL_BACKUPS=$(find "$BACKUP_DIR" -name "ai_ide_backup_*.sql.gz" | wc -l)
log "Backup completed successfully!"
log "Total backups stored: $TOTAL_BACKUPS"
log "Backup location: $BACKUP_DIR/${BACKUP_FILE}.gz"

exit 0