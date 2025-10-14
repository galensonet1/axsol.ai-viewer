-- Add weekly_construction_plan column to projects (stores public URL to CZML under /data)
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS weekly_construction_plan TEXT;
