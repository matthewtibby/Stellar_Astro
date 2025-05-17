-- Create project_shares table
CREATE TABLE IF NOT EXISTS project_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  UNIQUE(project_id)
);

-- Add RLS policies for project_shares
ALTER TABLE project_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project shares are viewable by anyone"
  ON project_shares
  FOR SELECT
  USING (true);

CREATE POLICY "Project shares can be created by project owners"
  ON project_shares
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM projects WHERE id = project_id
    )
  );

CREATE POLICY "Project shares can be deleted by project owners"
  ON project_shares
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM projects WHERE id = project_id
    )
  );

-- Add is_public column to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

-- Update RLS policies for projects to allow public access
CREATE POLICY "Public projects are viewable by anyone"
  ON projects
  FOR SELECT
  USING (is_public = true);

-- Create function to check if a project is shared
CREATE OR REPLACE FUNCTION is_project_shared(project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM project_shares
    WHERE project_shares.project_id = is_project_shared.project_id
    AND project_shares.expires_at > NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 