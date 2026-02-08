-- ═══════════════════════════════════════════════════════════
-- SkillRespec Phase 4 - Team Sync Tables
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  invite_code VARCHAR(6) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team members table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  display_name VARCHAR(100),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Team skill packs table
CREATE TABLE IF NOT EXISTS team_skill_packs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  skills TEXT[] NOT NULL DEFAULT '{}',
  created_by VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_skill_packs_team_id ON team_skill_packs(team_id);
CREATE INDEX IF NOT EXISTS idx_teams_invite_code ON teams(invite_code);

-- Enable RLS (Row Level Security)
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_skill_packs ENABLE ROW LEVEL SECURITY;

-- Policies for public access (for demo purposes)
-- In production, replace with proper auth-based policies

-- Teams: anyone can read, authenticated users can create
CREATE POLICY "Teams are viewable by everyone" ON teams
  FOR SELECT USING (true);

CREATE POLICY "Teams can be created by anyone" ON teams
  FOR INSERT WITH CHECK (true);

-- Team members: anyone can read/write (for demo)
CREATE POLICY "Team members are viewable by everyone" ON team_members
  FOR SELECT USING (true);

CREATE POLICY "Team members can be created by anyone" ON team_members
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Team members can be updated by anyone" ON team_members
  FOR UPDATE USING (true);

-- Team skill packs: anyone can read/write (for demo)
CREATE POLICY "Skill packs are viewable by everyone" ON team_skill_packs
  FOR SELECT USING (true);

CREATE POLICY "Skill packs can be created by anyone" ON team_skill_packs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Skill packs can be deleted by anyone" ON team_skill_packs
  FOR DELETE USING (true);

-- ═══════════════════════════════════════════════════════════
-- Usage Analytics Tables (optional, for future use)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS skill_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  skill_id VARCHAR(100) NOT NULL,
  user_id VARCHAR(100),
  invocations INTEGER DEFAULT 0,
  errors INTEGER DEFAULT 0,
  avg_response_ms INTEGER DEFAULT 0,
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(skill_id, user_id)
);

-- Function to increment skill usage
CREATE OR REPLACE FUNCTION increment_skill_usage(skill_id_input VARCHAR)
RETURNS void AS $$
BEGIN
  INSERT INTO skill_usage (skill_id, invocations, last_used)
  VALUES (skill_id_input, 1, NOW())
  ON CONFLICT (skill_id, user_id)
  DO UPDATE SET
    invocations = skill_usage.invocations + 1,
    last_used = NOW();
END;
$$ LANGUAGE plpgsql;

-- Enable RLS for skill_usage
ALTER TABLE skill_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Skill usage is viewable by everyone" ON skill_usage
  FOR SELECT USING (true);

CREATE POLICY "Skill usage can be created/updated by anyone" ON skill_usage
  FOR ALL USING (true);
