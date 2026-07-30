#!/bin/bash
# Verify a dorkhub prod pg_dump archive restores cleanly into a throwaway
# local Postgres (Homebrew postgresql@17+). Proves the backup is usable —
# run it after taking any snapshot you intend to rely on.
#
#   ./scripts/verify-restore.sh /path/to/dorkhub-prod-YYYYMMDD-HHMMSS.dump
#
# Prints restored row counts for eyeball parity against prod (see
# docs/ops-backup.md for the matching prod query). Cleans up on success;
# keeps the scratch instance dir on failure for inspection.
set -u
export LC_ALL=C LANG=C # macOS: postmaster refuses to start under a broken locale

DUMP="${1:?usage: verify-restore.sh <dump-file>}"
PORT="${2:-54329}"
SCRATCH="$(mktemp -d /tmp/dorkhub-restore-XXXXXX)"

fail() {
  echo "FAILED: $1 (scratch kept at $SCRATCH)"
  exit 1
}

initdb -D "$SCRATCH/data" -U scratch -E UTF8 >"$SCRATCH/initdb.log" 2>&1 || fail "initdb"
# TCP-only: unix socket paths overflow macOS's 103-byte limit under deep tmp dirs
pg_ctl -D "$SCRATCH/data" -o "-p $PORT -c listen_addresses=127.0.0.1 -c unix_socket_directories=''" \
  -l "$SCRATCH/pg.log" start >/dev/null 2>&1 || fail "pg_ctl start (see $SCRATCH/pg.log)"

PSQL=(psql -h 127.0.0.1 -p "$PORT" -U scratch)
"${PSQL[@]}" -d postgres -q -c 'create database restore_check;' || fail "createdb"

# The dump references Supabase-managed roles (policy TO clauses) and
# schema-qualified extension types; stub both before restoring.
"${PSQL[@]}" -d restore_check -q <<'SQL' || fail "role/extension preamble"
do $$ begin create role anon nologin; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
do $$ begin create role service_role nologin; exception when duplicate_object then null; end $$;
do $$ begin create role supabase_auth_admin nologin; exception when duplicate_object then null; end $$;
do $$ begin create role supabase_storage_admin nologin; exception when duplicate_object then null; end $$;
do $$ begin create role postgres nologin; exception when duplicate_object then null; end $$;
do $$ begin create role dashboard_user nologin; exception when duplicate_object then null; end $$;
create schema if not exists extensions;
create extension if not exists citext with schema extensions;
create extension if not exists pg_trgm with schema extensions;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;
SQL

pg_restore -h 127.0.0.1 -p "$PORT" -U scratch -d restore_check --no-owner --no-acl \
  "$DUMP" >"$SCRATCH/restore.log" 2>&1
ERRS=$(grep -c '^pg_restore: error:' "$SCRATCH/restore.log" || true)
# One benign error is expected: `schema "public" already exists`.
echo "pg_restore errors: $ERRS (1 expected: schema public already exists)"
grep '^pg_restore: error:' "$SCRATCH/restore.log" | grep -v 'schema "public" already exists' \
  && fail "unexpected restore errors above"

echo "--- restored row counts (compare against prod, docs/ops-backup.md) ---"
"${PSQL[@]}" -d restore_check -P pager=off -t -c "
select 'profiles', count(*) from public.profiles
union all select 'projects', count(*) from public.projects
union all select 'projects_published', count(*) from public.projects where status='published'
union all select 'likes', count(*) from public.likes
union all select 'saves', count(*) from public.saves
union all select 'follows', count(*) from public.follows
union all select 'collections', count(*) from public.collections
union all select 'collection_items', count(*) from public.collection_items
union all select 'tags', count(*) from public.tags
union all select 'ingest_candidates', count(*) from public.ingest_candidates
union all select 'moderation_screens', count(*) from public.moderation_screens
union all select 'project_reports', count(*) from public.project_reports
union all select 'featured_slots', count(*) from public.featured_slots
union all select 'claim_invites', count(*) from public.claim_invites
union all select 'ai_usage', count(*) from public.ai_usage
union all select 'auth_users', count(*) from auth.users
union all select 'auth_identities', count(*) from auth.identities
order by 1;" || fail "count query"

pg_ctl -D "$SCRATCH/data" stop >/dev/null 2>&1
rm -rf "$SCRATCH"
echo "OK: restore verified; scratch instance removed"
