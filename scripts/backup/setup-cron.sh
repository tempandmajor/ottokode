#!/bin/bash

# Setup automated backups with cron

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

log "Setting up automated backup cron jobs..."

# Create cron job for daily backups at 2 AM
CRON_JOB="0 2 * * * $SCRIPT_DIR/backup-all.sh >> /var/log/ai-ide-backup.log 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "$SCRIPT_DIR/backup-all.sh"; then
    warn "Backup cron job already exists"
else
    # Add cron job
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    log "Daily backup cron job added (runs at 2 AM)"
fi

# Create log directory
sudo mkdir -p /var/log
sudo touch /var/log/ai-ide-backup.log
sudo chmod 666 /var/log/ai-ide-backup.log

log "Automated backup setup completed!"
log "Backups will run daily at 2:00 AM"
log "Check logs at: /var/log/ai-ide-backup.log"

exit 0