-- ============================================================
-- EBRB Security Hardening Migration
-- Adds per-actor rate-limit tracking and tightens RLS
-- ============================================================

-- 1. Generic rate-limit counters, bucketed by (actor, bucket) per window.
--    actor = 'user:<uuid>' | 'ip:<hash>'
--    bucket = 'analyze' | 'chat' | 'refine' | 'generate-doc' | 'claim-session'
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor TEXT NOT NULL,
  bucket TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_actor_bucket_created
  ON rate_limits(actor, bucket, created_at DESC);

-- Service-role-only access (no client-side reads or writes)
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- 2. Purge helper — run from pg_cron or manually to trim history.
CREATE OR REPLACE FUNCTION purge_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- 3. Tighten messages / conversations RLS — ensure INSERT/UPDATE/DELETE
--    are service-role-only (RLS policies below only cover SELECT today).
--    Service role bypasses RLS, so no additional INSERT policy needed.
--    This is a defense-in-depth note, not a new policy.
