-- Debug policy: allow all inserts to raw-frames bucket
CREATE POLICY "Debug allow all raw-frames inserts 20240504"
  ON storage.objects FOR INSERT
  WITH CHECK (true); 