#!/bin/bash

# AI IDE Database Restore Script
# Restores PostgreSQL database from backup

set -e

# Configuration
BACKUP_DIR="/backups/database"
CONTAINER_NAME="ai-ide-postgres-1"
DB_NAME="ai_ide"
DB_USER="ai_ide_user"

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

# Function to show usage
usage() {
    echo "Usage: $0 [backup-file]"
    echo ""
    echo "If no backup file is specified, the script will show available backups"
    echo ""
    echo "Examples:"
    echo "  $0                                    # List available backups"
    echo "  $0 ai_ide_backup_20241201_120000.sql.gz  # Restore specific backup"
    echo ""
    exit 1
}

# List available backups
list_backups() {
    log "Available database backups:"
    echo ""

    if [ ! -d "$BACKUP_DIR" ]; then
        warn "Backup directory does not exist: $BACKUP_DIR"
        exit 1
    fi

    BACKUPS=$(find "$BACKUP_DIR" -name "ai_ide_backup_*.sql.gz" -type f | sort -r)

    if [ -z "$BACKUPS" ]; then
        warn "No backups found in $BACKUP_DIR"
        exit 1
    fi

    echo "File Name                           Size    Date"
    echo "----------------------------------------------------------------"

    for backup in $BACKUPS; do
        filename=$(basename "$backup")
        size=$(du -h "$backup" | cut -f1)
        date=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$backup" 2>/dev/null || stat -c "%y" "$backup" 2>/dev/null | cut -d' ' -f1,2 | cut -d. -f1)
        printf "%-35s %-8s %s\n" "$filename" "$size" "$date"
    done

    echo ""
    log "To restore a backup, run: $0 <backup-filename>"
}

# Main script
if [ $# -eq 0 ]; then
    list_backups
    exit 0
fi

BACKUP_FILE="$1"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE"

# Validate backup file
if [ ! -f "$BACKUP_PATH" ]; then
    error "Backup file not found: $BACKUP_PATH"
    echo ""
    list_backups
    exit 1
fi

# Check if Docker container is running
if ! docker ps --format "table {{.Names}}" | grep -q "$CONTAINER_NAME"; then
    error "PostgreSQL container '$CONTAINER_NAME' is not running"
    exit 1
fi

# Confirmation prompt
warn "This will REPLACE the current database with the backup!"
warn "Current database data will be LOST!"
echo ""
info "Backup file: $BACKUP_FILE"
info "Backup size: $(du -h "$BACKUP_PATH" | cut -f1)"
info "Backup date: $(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$BACKUP_PATH" 2>/dev/null || stat -c "%y" "$BACKUP_PATH" 2>/dev/null | cut -d' ' -f1,2 | cut -d. -f1)"
echo ""

read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirm

if [ "$confirm" != "yes" ]; then
    log "Restore cancelled"
    exit 0
fi

log "Starting database restore..."

# Create temporary file for uncompressed backup
TEMP_FILE=$(mktemp)
trap "rm -f $TEMP_FILE" EXIT

# Decompress backup
log "Decompressing backup..."
gunzip -c "$BACKUP_PATH" > "$TEMP_FILE"

# Drop existing connections
log "Dropping existing database connections..."
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d postgres -c "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '$DB_NAME' AND pid <> pg_backend_pid();" >/dev/null 2>&1 || true

# Drop and recreate database
log "Recreating database..."
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" >/dev/null
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" >/dev/null

# Restore database
log "Restoring database from backup..."
if docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" < "$TEMP_FILE"; then
    log "Database restored successfully!"

    # Verify restore
    TABLE_COUNT=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')
    log "Tables restored: $TABLE_COUNT"

else
    error "Failed to restore database"
    exit 1
fi

log "Database restore completed successfully!"
log "Please restart your application services to use the restored database"

exit 0