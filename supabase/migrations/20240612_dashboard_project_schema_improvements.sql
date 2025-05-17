-- Dashboard Project Schema Improvements

-- 1. Add metadata JSONB column to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Create equipment table (linked to projects)
CREATE TABLE IF NOT EXISTS equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- e.g., 'telescope', 'camera', 'filter'
  name TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_equipment_project_id ON equipment(project_id);

-- 3. Add tags column to projects (text array)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];

-- 4. Add status column to projects (enum)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
    CREATE TYPE project_status AS ENUM ('draft', 'in_progress', 'completed', 'archived', 'deleted');
  END IF;
END $$;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS status project_status DEFAULT 'draft';

-- 5. Add thumbnail_url column to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- 6. (Manual) Backfill/migrate existing projects to populate new fields as needed
--   (e.g., update status, tags, metadata, thumbnail_url, or create equipment rows)
--   This step may require custom SQL or scripts based on your data. 