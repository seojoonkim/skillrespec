-- ═══════════════════════════════════════════════════════════
-- SkillRespec - Skill Presets Table Schema
-- Run this in Supabase SQL Editor to set up the presets table
-- ═══════════════════════════════════════════════════════════

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create skill_presets table
CREATE TABLE IF NOT EXISTS skill_presets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    skills TEXT[] NOT NULL DEFAULT '{}',
    icon TEXT DEFAULT '📦',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_skill_presets_user_id ON skill_presets(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_presets_created_at ON skill_presets(created_at DESC);

-- Row Level Security (RLS)
ALTER TABLE skill_presets ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read all presets (for sharing)
CREATE POLICY "Anyone can read presets" ON skill_presets
    FOR SELECT USING (true);

-- Policy: Users can insert their own presets
CREATE POLICY "Users can insert own presets" ON skill_presets
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR user_id IS NULL
    );

-- Policy: Users can update their own presets
CREATE POLICY "Users can update own presets" ON skill_presets
    FOR UPDATE USING (
        auth.uid() = user_id OR user_id IS NULL
    );

-- Policy: Users can delete their own presets
CREATE POLICY "Users can delete own presets" ON skill_presets
    FOR DELETE USING (
        auth.uid() = user_id OR user_id IS NULL
    );

-- ═══════════════════════════════════════════════════════════
-- Example: Insert default presets (optional)
-- ═══════════════════════════════════════════════════════════

-- INSERT INTO skill_presets (id, name, description, skills, icon) VALUES
-- ('system-coding', '💻 Coding Mode', 'Development-focused skills', 
--  ARRAY['code-reviewer', 'git-workflow', 'shell-master'], '💻'),
-- ('system-writing', '✍️ Writing Mode', 'Documentation and content focus', 
--  ARRAY['doc-writer', 'markdown-pro'], '✍️'),
-- ('system-security', '🔒 Security Mode', 'Security-focused setup', 
--  ARRAY['prompt-guard', 'hivefence'], '🔒')
-- ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════
-- Function: Update updated_at on change
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_skill_presets_updated_at ON skill_presets;
CREATE TRIGGER update_skill_presets_updated_at
    BEFORE UPDATE ON skill_presets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════
-- Grant permissions for anonymous access (if needed)
-- ═══════════════════════════════════════════════════════════

-- Allow anonymous users to read/write presets (no auth required)
-- Comment these out if you want to require authentication

GRANT SELECT, INSERT, UPDATE, DELETE ON skill_presets TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON skill_presets TO authenticated;
