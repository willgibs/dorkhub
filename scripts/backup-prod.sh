#!/usr/bin/env bash
# Weekly prod snapshot (P4 L5, $0 launch posture) — the scheduled form of
# docs/ops-backup.md's manual runbook. Installed as a user launchd agent at
# ~/Library/LaunchAgents/com.dorkhub.backup.plist (Sun 09:00 local; launchd
# runs a missed interval at next wake, unlike cron). Secretless: credentials
# come from .env.local at runtime. Dumps hold auth emails — they live
# OUTSIDE the public repo, never in it. Keeps the newest $KEEP dumps.
set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"

BACKUP_DIR="/Users/gibby/local/ai/dorkhub-backups"
ENV_FILE="/Users/gibby/local/ai/dorkhub/.env.local"
KEEP=8

cd "$BACKUP_DIR"
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

STAMP=$(date -u +%Y%m%d-%H%M%S)
OUT="dorkhub-prod-$STAMP.dump"

PGPASSWORD="$SUPABASE_DB_PASSWORD" pg_dump \
  "postgresql://postgres.xvorwdvsnbpujyzfowwu@aws-0-us-east-1.pooler.supabase.com:5432/postgres" \
  -Fc --schema=public --schema=auth --schema=storage -f "$OUT"
shasum -a 256 "$OUT" > "$OUT.sha256"

# Prune to the newest $KEEP dumps (checksums ride along).
ls -1t dorkhub-prod-*.dump | tail -n +$((KEEP + 1)) | while read -r old; do
  rm -f "$old" "$old.sha256"
done

echo "$(date -u +%FT%TZ) wrote $OUT ($(du -h "$OUT" | cut -f1))" >> backup.log
