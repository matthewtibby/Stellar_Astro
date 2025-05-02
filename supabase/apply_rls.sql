-- Enable RLS on projects table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Public projects are viewable by anyone" ON projects;
DROP POLICY IF EXISTS "Users can create their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

-- Create new policies
CREATE POLICY "Users can view their own projects"
ON projects FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Public projects are viewable by anyone"
ON projects FOR SELECT
TO authenticated
USING (is_public = true);

CREATE POLICY "Users can create their own projects"
ON projects FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
ON projects FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
ON projects FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Grant necessary permissions to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON projects TO authenticated; 