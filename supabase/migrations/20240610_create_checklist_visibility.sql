-- Checklist visibility per user and route
CREATE TABLE IF NOT EXISTS checklist_visibility (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  route TEXT NOT NULL,
  visible BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, route)
);

-- Enable RLS
ALTER TABLE checklist_visibility ENABLE ROW LEVEL SECURITY;

-- Policy: Only allow users to read their own visibility
CREATE POLICY "Users can view their own checklist visibility"
  ON checklist_visibility FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Only allow users to insert their own visibility
CREATE POLICY "Users can insert their own checklist visibility"
  ON checklist_visibility FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Only allow users to update their own visibility
CREATE POLICY "Users can update their own checklist visibility"
  ON checklist_visibility FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Only allow users to delete their own visibility
CREATE POLICY "Users can delete their own checklist visibility"
  ON checklist_visibility FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON checklist_visibility TO authenticated; 