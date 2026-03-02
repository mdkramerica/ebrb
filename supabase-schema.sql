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

-- ─── Profiles ───────────────────────────────────────────────────────────────
-- Stores user profile data, linked to Supabase Auth
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'executive', 'unlimited')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- ─── Auth trigger ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── User linking ──────────────────────────────────────────────────────────
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- ─── Verify ──────────────────────────────────────────────────────────────────
SELECT 'profiles' AS table_name, COUNT(*) FROM profiles
UNION ALL
SELECT 'sessions', COUNT(*) FROM sessions
UNION ALL
SELECT 'documents', COUNT(*) FROM documents;
