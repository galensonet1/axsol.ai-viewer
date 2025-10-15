-- Drop and recreate the public schema to ensure a completely clean state
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Create the projects table
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    business_id VARCHAR(255),
    api_base_url VARCHAR(255),
    project_polygon_geojson JSONB,
    layout_geojson JSONB,
    initial_location JSONB
);

-- IFC files per project (Cesium Ion assets)
CREATE TABLE project_ifc_files (
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

CREATE INDEX idx_project_ifc_files_project ON project_ifc_files(project_id);

-- Create the roles table
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create the users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    auth0_sub VARCHAR(100) UNIQUE NOT NULL, -- Unique identifier from Auth0
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create the user_roles join table
CREATE TABLE user_roles (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Create the project_permissions table
CREATE TABLE project_permissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    permission_level VARCHAR(20) NOT NULL DEFAULT 'viewer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, project_id)
);

-- Indexes for project_permissions
CREATE INDEX IF NOT EXISTS idx_project_permissions_user_id ON project_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_project_permissions_project_id ON project_permissions(project_id);
CREATE INDEX IF NOT EXISTS idx_project_permissions_level ON project_permissions(permission_level);

-- Insert initial roles
INSERT INTO roles (name) VALUES
('admin'),
('manager'),
('viewer'),
('operator');

-- Insert sample data for projects
INSERT INTO projects (id, name, description, start_date, end_date, business_id, api_base_url, project_polygon_geojson, layout_geojson, initial_location) VALUES
(1, 'Proyecto CPF Mata Mora', 'Planta de tratamiento de gas en la formación Vaca Muerta.', '2025-05-01', '2026-07-31', '68379c08e6954af9ff9ffa76', 'https://api-test.axsol.com.ar/api/v1', '{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [-68.3220786838975, -38.5002876131704],
          [-68.3215585501828, -38.4990012561592],
          [-68.3195668936752, -38.49949652645642],
          [-68.31932853519582, -38.49939995864157],
          [-68.3191259641417, -38.4988977251099],
          [-68.3184672310166, -38.4990622454519],
          [-68.3186782063621, -38.4995786547543],
          [-68.31928736387974, -38.49942457753008],
          [-68.31950357089268, -38.499512273094055],
          [-68.3190467990928, -38.4996258597011],
          [-68.3195637328727, -38.5009144560628],
          [-68.3220786838975, -38.5002876131704]
        ]]
      }
    }
  ]
}', '{
  "type": "FeatureCollection",
  "features": []
}', '{"lon": -68.320, "lat": -38.500, "alt": 300, "heading": 0, "pitch": -90, "roll": 0}');

INSERT INTO projects (id, name, description, start_date, end_date, business_id, api_base_url, project_polygon_geojson, layout_geojson, initial_location) VALUES
(2, 'Parque Eólico del Sur', 'Desarrollo de un parque eólico en la Patagonia', '2026-03-15', '2028-10-20', 'PE-SUR-01', 'https://api-test.axsol.com.ar/api/v1', NULL, '{
  "type": "FeatureCollection",
  "features": []
}', '{"lon": -69.500, "lat": -50.100, "alt": 150, "heading": 0, "pitch": -90, "roll": 0}');

-- Insert sample users
INSERT INTO users (auth0_sub, email, name) VALUES
('auth0|seed_admin', 'admin@axsol.ai', 'Cristian Administrador'),
('auth0|seed_manager', 'maria.gerente@axsol.ai', 'María Gerente'),
('auth0|seed_operator', 'juan.operador@axsol.ai', 'Juan Operador'),
('auth0|seed_viewer', 'ana.consultora@axsol.ai', 'Ana Consultora')
ON CONFLICT (email) DO NOTHING;

-- Map users to roles
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u JOIN roles r ON r.name = 'admin' WHERE u.email = 'admin@axsol.ai'
ON CONFLICT (user_id, role_id) DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u JOIN roles r ON r.name = 'manager' WHERE u.email = 'maria.gerente@axsol.ai'
ON CONFLICT (user_id, role_id) DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u JOIN roles r ON r.name = 'operator' WHERE u.email = 'juan.operador@axsol.ai'
ON CONFLICT (user_id, role_id) DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u JOIN roles r ON r.name = 'viewer' WHERE u.email = 'juan.operador@axsol.ai'
ON CONFLICT (user_id, role_id) DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u JOIN roles r ON r.name = 'viewer' WHERE u.email = 'ana.consultora@axsol.ai'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Project permissions (who can access what)
INSERT INTO project_permissions (user_id, project_id, permission_level)
SELECT u.id, 1, 'admin' FROM users u WHERE u.email = 'admin@axsol.ai'
ON CONFLICT DO NOTHING;

INSERT INTO project_permissions (user_id, project_id, permission_level)
SELECT u.id, 2, 'admin' FROM users u WHERE u.email = 'admin@axsol.ai'
ON CONFLICT DO NOTHING;

INSERT INTO project_permissions (user_id, project_id, permission_level)
SELECT u.id, 1, 'editor' FROM users u WHERE u.email = 'maria.gerente@axsol.ai'
ON CONFLICT DO NOTHING;

INSERT INTO project_permissions (user_id, project_id, permission_level)
SELECT u.id, 1, 'viewer' FROM users u WHERE u.email = 'ana.consultora@axsol.ai'
ON CONFLICT DO NOTHING;

INSERT INTO project_ifc_files (project_id, file_name, asset_id, input_crs, description, file_size, etag, processing_status) VALUES
  (1, 'K-4101_02.ifc', 3877283, 'EPSG:22182', NULL, 13651, '"21e95d1f67f00bd9fdd2d592486d3b2e"', 'uploaded'),
  (1, 'K-4301_02.ifc', 3877324, 'EPSG:22182', NULL, 350439, '"d5a33d6493d5e7c47f2680725ba4f1ac"', 'uploaded'),
  (1, 'K-4701_02 K-4501.ifc', 3877327, 'EPSG:22182', NULL, 412683102, '"a4574b6a1a71d30e93b47926de1c8dd2"', 'uploaded'),
  (1, 'PA-8101AB.ifc', 3877338, 'EPSG:22182', NULL, 32163, '"84fbc77baeaf799a357b14760f02ac03"', 'uploaded'),
  (1, 'TANQUES.ifc', 3877340, 'EPSG:22182', NULL, 7157839, '"96717cbb8553c27c9d58328fda8be138"', 'uploaded'),
  (1, 'PI_SENDA 1-2.ifc', 3877351, 'EPSG:22182', NULL, 1989915, '"3818a4d946ebc6ffa459e0ed02ec60ec"', 'uploaded'),
  (1, 'PI_SENDA 3.ifc', 3877356, 'EPSG:22182', NULL, 445642, '"fdc86c5a120e1bce2848ef2ced445ae6"', 'uploaded'),
  (1, 'PI_SENDA 4.ifc', 3877358, 'EPSG:22182', NULL, 313823, '"9ced84c126512f8f0a28934d59029640"', 'uploaded'),
  (1, 'PI_SENDA 6.ifc', 3877360, 'EPSG:22182', NULL, 2365505, '"250939f7e34a023098325e5d29a53728"', 'uploaded'),
  (1, 'SK-3104.ifc', 3877363, 'EPSG:22182', NULL, 35250, '"c005988276778feaf553e8fa8797c324"', 'uploaded'),
  (1, 'SK-1101.ifc', 3877364, 'EPSG:22182', NULL, 8218812, '"23892cec91e12a6a7188fb5408f7a22f"', 'uploaded'),
  (1, 'SK-1102.ifc', 3877365, 'EPSG:22182', NULL, 8156096, '"ed832074c37ccd9a43d4b74a2e1d512e"', 'uploaded'),
  (1, 'SK-1108.ifc', 3877366, 'EPSG:22182', NULL, 2655417, '"1c1fa3c13c5ac6f64e81ad055e8073f8"', 'uploaded'),
  (1, 'SK-3102.ifc', 3877369, 'EPSG:22182', NULL, 2458026, '"e1dfe9588ef49129e87e90ea3a42a42d"', 'uploaded'),
  (1, 'SK-4103.ifc', 3877372, 'EPSG:22182', NULL, 794207, '"b995d810ad06424d6762a5d69060f8a2"', 'uploaded'),
  (1, 'SK-4303.ifc', 3877373, 'EPSG:22182', NULL, 793459, '"63b655d2d1b47cf2c6f479dec04e2545"', 'uploaded'),
  (1, 'SK-5101.ifc', 3877376, 'EPSG:22182', NULL, 408790, '"b0d446d952329ae7d5802c45eb4d9c28"', 'uploaded'),
  (1, 'SK-5303.ifc', 3877379, 'EPSG:22182', NULL, 1051698, '"a3a2ae96440df9433f52e69a109175cb"', 'uploaded'),
  (1, 'SK-5510.ifc', 3877382, 'EPSG:22182', NULL, 625202, '"05824b9198e4a617ead306a5ba14d1f1"', 'uploaded'),
  (1, 'SK-8102.ifc', 3877385, 'EPSG:22182', NULL, 740335, '"3978bb1b2bd1167b37926f5478774a6e"', 'uploaded'),
  (1, 'SK-8301.ifc', 3877389, 'EPSG:22182', NULL, 873949, '"bfc4f544a24a1cf7e26e9b53bf6bd625"', 'uploaded'),
  (1, 'SK-8501.ifc', 3877392, 'EPSG:22182', NULL, 27633719, '"e83e3ade3ccee834ced53002ee12bebb"', 'uploaded'),
  (1, 'SK-8502.ifc', 3877395, 'EPSG:22182', NULL, 848277, '"c6404aea97a62acb4bc7699746043ca6"', 'uploaded'),
  (1, 'SLCI.ifc', 3877397, 'EPSG:22182', NULL, 27402768, '"5f23dd0375be85172558527fecfade93"', 'uploaded');
-- END project_ifc_files seed export
