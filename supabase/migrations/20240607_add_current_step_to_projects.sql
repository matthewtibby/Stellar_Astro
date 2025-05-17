-- Add current_step column to projects table for workflow progress tracking
ALTER TABLE projects ADD COLUMN current_step integer DEFAULT 0; 