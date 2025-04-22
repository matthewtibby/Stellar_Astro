-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('profile-pictures', 'profile-pictures', true),
  ('raw-frames', 'raw-frames', false),
  ('master-frames', 'master-frames', false),
  ('calibrated-frames', 'calibrated-frames', false),
  ('stacked-frames', 'stacked-frames', false),
  ('pre-processed', 'pre-processed', false),
  ('post-processed', 'post-processed', false);

-- Profile pictures policies
CREATE POLICY "Profile pictures are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-pictures');

CREATE POLICY "Users can upload their own profile picture"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-pictures' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own profile picture"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'profile-pictures' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own profile picture"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'profile-pictures' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Raw frames policies
CREATE POLICY "Project owners can access their raw frames"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'raw-frames' AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = (storage.foldername(name))[1]::uuid
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can upload raw frames"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'raw-frames' AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = (storage.foldername(name))[1]::uuid
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can delete their raw frames"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'raw-frames' AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = (storage.foldername(name))[1]::uuid
      AND projects.user_id = auth.uid()
    )
  );

-- Master frames policies
CREATE POLICY "Project owners can access their master frames"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'master-frames' AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = (storage.foldername(name))[1]::uuid
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can upload master frames"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'master-frames' AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = (storage.foldername(name))[1]::uuid
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can delete their master frames"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'master-frames' AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = (storage.foldername(name))[1]::uuid
      AND projects.user_id = auth.uid()
    )
  );

-- Calibrated frames policies
CREATE POLICY "Project owners can access their calibrated frames"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'calibrated-frames' AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = (storage.foldername(name))[1]::uuid
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can upload calibrated frames"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'calibrated-frames' AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = (storage.foldername(name))[1]::uuid
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can delete their calibrated frames"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'calibrated-frames' AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = (storage.foldername(name))[1]::uuid
      AND projects.user_id = auth.uid()
    )
  );

-- Stacked frames policies
CREATE POLICY "Project owners can access their stacked frames"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'stacked-frames' AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = (storage.foldername(name))[1]::uuid
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can upload stacked frames"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'stacked-frames' AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = (storage.foldername(name))[1]::uuid
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can delete their stacked frames"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'stacked-frames' AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = (storage.foldername(name))[1]::uuid
      AND projects.user_id = auth.uid()
    )
  );

-- Pre-processed images policies
CREATE POLICY "Project owners can access their pre-processed images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'pre-processed' AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = (storage.foldername(name))[1]::uuid
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can upload pre-processed images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'pre-processed' AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = (storage.foldername(name))[1]::uuid
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can delete their pre-processed images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'pre-processed' AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = (storage.foldername(name))[1]::uuid
      AND projects.user_id = auth.uid()
    )
  );

-- Post-processed images policies
CREATE POLICY "Project owners can access their post-processed images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'post-processed' AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = (storage.foldername(name))[1]::uuid
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can upload post-processed images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'post-processed' AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = (storage.foldername(name))[1]::uuid
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can delete their post-processed images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'post-processed' AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = (storage.foldername(name))[1]::uuid
      AND projects.user_id = auth.uid()
    )
  ); 