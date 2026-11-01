#!/usr/bin/env bash
# Proves the latest backup can be restored, without touching the live site (Phase 7c). Downloads the newest
# snapshot from B2 into a scratch folder, loads the database dump into a throwaway PostgreSQL container and
# prints what came back. A backup that was never restored is only a hope; run this now and then.
set -Eeuo pipefail

ENV_FILE="${BLOG_BACKUP_ENV:-$HOME/.config/blog-backup.env}"
RESTIC_IMAGE="restic/restic:0.19.1"
SCRATCH="$(mktemp -d "$HOME/restore-check.XXXXXX")"
DB_CONTAINER="blog-restore-check"

cleanup() {
    docker rm -f "$DB_CONTAINER" > /dev/null 2>&1 || true
    rm -rf "$SCRATCH"
}
trap cleanup EXIT

echo "== Snapshots in B2"
docker run --rm --env-file "$ENV_FILE" "$RESTIC_IMAGE" snapshots --host blog-vps

echo "== Restoring the latest snapshot"
docker run --rm --env-file "$ENV_FILE" -v "$SCRATCH:/restore" "$RESTIC_IMAGE" \
    restore latest --host blog-vps --target /restore

echo "== Loading the database dump into a throwaway PostgreSQL"
docker run -d --name "$DB_CONTAINER" -e POSTGRES_PASSWORD=restore-check postgres:18-alpine > /dev/null
until docker exec "$DB_CONTAINER" pg_isready -U postgres > /dev/null 2>&1; do sleep 1; done
docker cp "$SCRATCH/backup/db/blog.dump" "$DB_CONTAINER:/tmp/blog.dump"
docker exec "$DB_CONTAINER" createdb -U postgres blog
docker exec "$DB_CONTAINER" pg_restore -U postgres -d blog --no-owner --exit-on-error /tmp/blog.dump

echo "== What came back"
docker exec "$DB_CONTAINER" psql -U postgres -d blog -At -c "
    select 'migrations', count(*) from databasechangelog
    union all select 'posts', count(*) from post
    union all select 'pages', count(*) from page
    union all select 'experiences', count(*) from experience
    union all select 'uses items', count(*) from uses_item
    union all select 'media rows', count(*) from media"
echo "media files|$(find "$SCRATCH/backup/media" -type f | wc -l | tr -d ' ')"
echo "== Restore check passed"
