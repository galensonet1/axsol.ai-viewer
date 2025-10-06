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

-- Create the roles table
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- Create the users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    auth0_sub VARCHAR(100) UNIQUE NOT NULL, -- Unique identifier from Auth0
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create the user_roles join table
CREATE TABLE user_roles (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Insert initial roles
INSERT INTO roles (name) VALUES
('Viewer'),
('Supervisor'),
('Manager'),
('Admin'),
('Superadmin');

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
