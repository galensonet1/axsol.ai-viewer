-- Safe migration: create table for IFC assets per project if not exists
CREATE TABLE IF NOT EXISTS project_ifc_files (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  asset_id BIGINT NOT NULL,
  input_crs VARCHAR(50) DEFAULT 'EPSG:22182',
  description TEXT,
  file_size BIGINT,
  etag VARCHAR(128),
  processing_status VARCHAR(32) DEFAULT 'uploaded',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_project_ifc_files_project ON project_ifc_files(project_id);
