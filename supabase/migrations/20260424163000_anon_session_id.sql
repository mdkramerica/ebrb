-- Add anon_session_id to sessions and conversations.
--
-- Anonymous users get a cookie-scoped ID set by middleware on their first
-- request. Sessions and conversations they create while logged out are
-- stamped with that ID so /api/claim-session can fold them into a real
-- account on signup.

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS anon_session_id TEXT;

CREATE INDEX IF NOT EXISTS idx_sessions_anon
  ON sessions(anon_session_id)
  WHERE anon_session_id IS NOT NULL;

ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS anon_session_id TEXT;

CREATE INDEX IF NOT EXISTS idx_conversations_anon
  ON conversations(anon_session_id)
  WHERE anon_session_id IS NOT NULL;
