#!/usr/bin/env bash
# Nightly backup of the site (Phase 7c): a dump of the database plus the uploaded images, sent with restic to
# Backblaze B2. restic encrypts on this server before anything leaves it, uploads only what changed, and keeps
# 7 daily, 4 weekly and 6 monthly snapshots. Run by blog-backup.timer; safe to run by hand any time.
#
# Secrets live only in the env file (see blog-backup.env.example), never in this repository.
set -Eeuo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${BLOG_BACKUP_ENV:-$HOME/.config/blog-backup.env}"
DUMP_DIR="${BLOG_BACKUP_DUMP_DIR:-$HOME/backups/db}"
RESTIC_IMAGE="restic/restic:0.19.1"
# Snapshots are grouped by host when old ones are forgotten; the restic container's own name changes every run
HOST="blog-vps"
# Named by the compose project (name: in compose.yaml)
MEDIA_VOLUME="mustafabatmaz-blog_media"

# shellcheck source=/dev/null
source "$ENV_FILE"
compose=(docker compose -f "$REPO_DIR/infra/compose.yaml" -f "$REPO_DIR/infra/compose.prod.yaml")

# healthchecks.io: start, then success or failure. A run that never reports counts as failed there (7c decision 5)
ping() {
    if [[ -n "${HEALTHCHECK_URL:-}" ]]; then
        curl -fsS -m 10 --retry 3 -o /dev/null "${HEALTHCHECK_URL}$1" || true
    fi
}
trap 'ping /fail' ERR
ping /start

restic() {
    docker run --rm --env-file "$ENV_FILE" \
        -v "$DUMP_DIR:/backup/db:ro" \
        -v "$MEDIA_VOLUME:/backup/media:ro" \
        "$RESTIC_IMAGE" "$@"
}

# A consistent snapshot of the database while the site keeps running. Written next to the previous dump first,
# so a failed dump never replaces the last good one; the latest dump stays here for a quick local restore
mkdir -p "$DUMP_DIR"
# shellcheck disable=SC2016  # $POSTGRES_* expand inside the postgres container, not here
"${compose[@]}" exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom' \
    > "$DUMP_DIR/blog.dump.partial"
mv "$DUMP_DIR/blog.dump.partial" "$DUMP_DIR/blog.dump"

restic backup --host "$HOST" --tag nightly /backup
restic forget --host "$HOST" --keep-daily 7 --keep-weekly 4 --keep-monthly 6 --prune

# Sundays: make sure what is stored in B2 can still be read
if [[ "$(date +%u)" == "7" ]]; then
    restic check
fi

ping ""
