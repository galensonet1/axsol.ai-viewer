-- Add opcions JSONB column to projects
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS opcions JSONB DEFAULT '{}'::jsonb;
