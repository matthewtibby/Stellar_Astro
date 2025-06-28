-- Add 'id' column to processing_steps for workflow step identifier
ALTER TABLE processing_steps ADD COLUMN IF NOT EXISTS id TEXT;

-- Optionally, you can backfill existing rows with known step IDs if you have a mapping.
-- For example:
-- UPDATE processing_steps SET id = 'upload-frames' WHERE step_name = 'Upload Frames';
-- UPDATE processing_steps SET id = 'calibrate-frames' WHERE step_name = 'Calibrate Frames';
-- ... (repeat for each known step) 