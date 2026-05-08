#!/bin/bash
set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/koperasilink"
DB_NAME=${DB_NAME:-koperasilink}
DB_USER=${DB_USER:-koperasi}

mkdir -p $BACKUP_DIR

echo "Starting database backup..."
docker compose -f infra/docker/docker-compose.prod.yml exec -T postgres pg_dump -U $DB_USER $DB_NAME | gzip > "$BACKUP_DIR/db_$TIMESTAMP.sql.gz"

# Keep last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "✅ Backup completed: db_$TIMESTAMP.sql.gz (size: $(du -h $BACKUP_DIR/db_$TIMESTAMP.sql.gz | cut -f1))"
