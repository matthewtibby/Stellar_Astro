-- Allow project owners to upload files to the raw-frames bucket
CREATE POLICY "Project owners can upload their raw frames"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'raw-frames' AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = (storage.foldername(name))[1]::uuid
      AND projects.user_id = auth.uid()
    )
  ); 