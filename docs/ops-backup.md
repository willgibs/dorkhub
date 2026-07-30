# Backups (until Supabase Pro)

The free tier has no automated backups. Until Supabase Pro (vision: "only when
forced"), backups are manual pg_dumps — **required before every destructive
prod operation**, prudent weekly once real users exist.

**Dumps contain auth emails. They live OUTSIDE this public repo, never in it:**
`/Users/gibby/local/ai/dorkhub-backups/` (Will's machine).

## Take a snapshot

```bash
cd /Users/gibby/local/ai/dorkhub-backups
set -a && source /Users/gibby/local/ai/dorkhub/.env.local && set +a
STAMP=$(date -u +%Y%m%d-%H%M%S)
PGPASSWORD="$SUPABASE_DB_PASSWORD" pg_dump \
  "postgresql://postgres.xvorwdvsnbpujyzfowwu@aws-0-us-east-1.pooler.supabase.com:5432/postgres" \
  -Fc --schema=public --schema=auth --schema=storage \
  -f "dorkhub-prod-$STAMP.dump"
shasum -a 256 "dorkhub-prod-$STAMP.dump" > "dorkhub-prod-$STAMP.dump.sha256"
```

Session pooler (port 5432) supports pg_dump; local pg_dump major version must
be ≥ the server's (17.x as of 2026-07).

## Verify it restores (do this for any snapshot you intend to rely on)

```bash
./scripts/verify-restore.sh /Users/gibby/local/ai/dorkhub-backups/dorkhub-prod-<STAMP>.dump
```

Spins up a throwaway local Postgres (TCP-only on 127.0.0.1:54329), stubs the
Supabase roles + `extensions`-schema types the dump references, restores with
`--no-owner --no-acl`, prints row counts. Exactly one restore error is
expected (`schema "public" already exists`). Compare counts against prod:
the same UNION query lives in the script — run it against the pooler URL.

## Disaster restore (sketch — the part that is inherently manual)

1. Fresh Supabase project → apply `supabase/migrations/0001..latest` via
   `psql --single-transaction -v ON_ERROR_STOP=1` (recreates schema, grants,
   RLS, functions — the dump's schema objects are a fallback, not the source
   of truth).
2. Data: `pg_restore --data-only --disable-triggers` per schema (needs
   `session_replication_role = replica` on Supabase; triggers must NOT fire
   during bulk load or counters/trending recompute mid-restore).
3. Auth: restored `auth.users`/`auth.identities` keep working with GitHub
   OAuth (identities key on provider ids), but rotate the project keys into
   Vercel env and update the Supabase URL config.
4. Re-point `NEXT_PUBLIC_SUPABASE_URL` / keys in Vercel; redeploy.

## Log

- 2026-07-30 · `dorkhub-prod-20260730-045500.dump` (1.6 MB) — restore verified
  end-to-end, 17/17 table-count parity incl. auth. Taken as the P4 L0
  pre-purge snapshot.
