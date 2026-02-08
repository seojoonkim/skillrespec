-- ═══════════════════════════════════════════════════════════
-- Skill History Table - Track skill changes with rollback support
-- ═══════════════════════════════════════════════════════════

-- Create skill_history table
CREATE TABLE IF NOT EXISTS skill_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,  -- Optional user identifier
  action TEXT NOT NULL CHECK (action IN ('install', 'remove', 'update', 'config_change')),
  skill_id TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  skills_snapshot TEXT[] NOT NULL DEFAULT '{}',  -- All skill IDs at this point in time
  previous_version TEXT,
  new_version TEXT,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_skill_history_user_id ON skill_history(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_history_skill_id ON skill_history(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_history_timestamp ON skill_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_skill_history_action ON skill_history(action);

-- Enable Row Level Security
ALTER TABLE skill_history ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert (for anonymous tracking)
CREATE POLICY "Anyone can insert skill history"
  ON skill_history FOR INSERT
  WITH CHECK (true);

-- Policy: Users can read their own history
CREATE POLICY "Users can read their own history"
  ON skill_history FOR SELECT
  USING (
    user_id IS NULL OR 
    user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- Policy: Anonymous reads allowed for demo/public data
CREATE POLICY "Anonymous reads for public history"
  ON skill_history FOR SELECT
  USING (user_id IS NULL);

-- Function to cleanup old history (optional, for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_skill_history(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM skill_history
  WHERE timestamp < NOW() - (days_to_keep || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comment for documentation
COMMENT ON TABLE skill_history IS 'Tracks skill installation, removal, updates, and config changes with full snapshot for rollback';
COMMENT ON COLUMN skill_history.skills_snapshot IS 'Array of all skill IDs installed at the time of this action';
COMMENT ON COLUMN skill_history.metadata IS 'Additional data like config changes, reasons, etc.';
