#!/bin/bash

# Configuration
DB_USER="hutan_kita_user"
DB_PASS="hutan_kita_password"
DB_NAME="hutan_kita_db"
DB_HOST="localhost"
DB_PORT="5432"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "Starting database backup for $DB_NAME via localhost..."

# Export PGPASSWORD to avoid interactive prompt
export PGPASSWORD="$DB_PASS"

# Use local pg_dump (specifically version 17 to match the server)
if command -v pg_dump-17 &> /dev/null; then
    PG_DUMP_BIN="pg_dump-17"
else
    PG_DUMP_BIN="pg_dump"
fi

$PG_DUMP_BIN -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"

# Unset PGPASSWORD for security
unset PGPASSWORD

if [ $? -eq 0 ]; then
    echo "Backup successful: $BACKUP_FILE"
    
    # Compress the backup
    gzip "$BACKUP_FILE"
    echo "Backup compressed: ${BACKUP_FILE}.gz"
else
    echo "Error: Database backup failed."
    rm -f "$BACKUP_FILE"
    exit 1
fi
