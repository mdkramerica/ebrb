-- ============================================================
-- EBRB Phase 2 Migration — V2 Schema Extensions
-- Run this in the Supabase SQL editor (in order)
-- ============================================================

-- 1. Extend sessions table with V2 fields
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS intent TEXT,
  ADD COLUMN IF NOT EXISTS completion_status JSONB,
  ADD COLUMN IF NOT EXISTS hiring_confidence_notes TEXT;

-- 2. Extend documents to support new doc types
--    (Drop old constraint, add broader one)
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_doc_type_check;
ALTER TABLE documents
  ADD CONSTRAINT documents_doc_type_check
  CHECK (doc_type IN (
    'resume',
    'cover_letter',
    'ats_report',
    'executive_bio',
    'linkedin_summary',
    'board_bio',
    'speaking_intro',
    'interview_stories',
    'traction_diagnostic',
    'positioning_brief'
  ));

-- 3. Conversations table (for chat sessions)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  intent TEXT,
  status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'complete', 'abandoned')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_session ON conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);

-- 4. Messages table (for chat message history)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);

-- 5. Modular achievements library
CREATE TABLE IF NOT EXISTS modular_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  role_context TEXT,
  tags TEXT[],
  used_in_session UUID REFERENCES sessions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_modular_achievements_user ON modular_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_modular_achievements_session ON modular_achievements(session_id);

-- 6. RLS Policies
--    Using the same service-role-only pattern as existing tables
--    (API routes use admin client which bypasses RLS)

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE modular_achievements ENABLE ROW LEVEL SECURITY;

-- Users can read their own conversations
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = user_id);

-- Users can read messages in their own conversations
CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );

-- Users can read their own modular achievements
CREATE POLICY "Users can view own achievements"
  ON modular_achievements FOR SELECT
  USING (auth.uid() = user_id);

-- Note: INSERT/UPDATE/DELETE for all three tables is handled
-- exclusively via the service role (admin) client in API routes.
-- No client-side write policies needed.

-- 7. Updated_at trigger for conversations
CREATE OR REPLACE FUNCTION update_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS conversations_updated_at ON conversations;
CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_conversations_updated_at();
