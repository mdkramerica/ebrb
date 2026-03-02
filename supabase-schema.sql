-- EBRB Supabase Schema
-- Run this in the Supabase SQL Editor at: https://supabase.com/dashboard/project/[your-project]/sql

-- ─── Sessions ────────────────────────────────────────────────────────────────
-- Stores each analysis session (anonymous, keyed by a UUID token)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  job_posting TEXT NOT NULL,
  resume TEXT NOT NULL,
  tone TEXT NOT NULL DEFAULT 'balanced',
  context TEXT NOT NULL DEFAULT 'external',
  output_preference TEXT NOT NULL DEFAULT 'both',
  ip_hash TEXT,                     -- hashed, not raw IP
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Documents ───────────────────────────────────────────────────────────────
-- Stores generated resume, cover letter, ATS report per session
-- Multiple versions supported (version column increments on refinement)
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('resume', 'cover_letter', 'ats_report')),
  content TEXT NOT NULL,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_documents_session ON documents(session_id);
CREATE INDEX IF NOT EXISTS idx_documents_type_version ON documents(session_id, doc_type, version DESC);

-- ─── RLS Policies ────────────────────────────────────────────────────────────
-- We use the service role key in API routes (bypasses RLS)
-- RLS is enabled as a safety net — no public access to raw data
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- No public access (all access goes through service role in API routes)
CREATE POLICY "No public access to sessions"
  ON sessions FOR ALL USING (false);

CREATE POLICY "No public access to documents"
  ON documents FOR ALL USING (false);

-- ─── Verify ──────────────────────────────────────────────────────────────────
SELECT 'sessions' AS table_name, COUNT(*) FROM sessions
UNION ALL
SELECT 'documents', COUNT(*) FROM documents;
