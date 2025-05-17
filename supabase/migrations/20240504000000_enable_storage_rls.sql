-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop any existing debug policies
DROP POLICY IF EXISTS "Debug allow all raw-frames inserts 20240504" ON storage.objects;

-- Create a permissive debug policy for all operations
CREATE POLICY "Debug allow all operations 20240504"
  ON storage.objects
  FOR ALL
  USING (true)
  WITH CHECK (true); 