CREATE DATABASE IF NOT EXISTS security_system;
USE security_system;

CREATE TABLE IF NOT EXISTS profiles (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role ENUM('citizen', 'authority') DEFAULT 'citizen',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
);

CREATE TABLE IF NOT EXISTS incident_categories (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3B82F6',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name)
);

CREATE TABLE IF NOT EXISTS incidents (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  category_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  address VARCHAR(500),
  status ENUM('pending', 'in_progress', 'resolved', 'rejected') DEFAULT 'pending',
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  incident_date DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  resolved_at DATETIME,
  resolved_by VARCHAR(36),
  deleted_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES profiles(id),
  FOREIGN KEY (category_id) REFERENCES incident_categories(id),
  FOREIGN KEY (resolved_by) REFERENCES profiles(id),
  INDEX idx_user_id (user_id),
  INDEX idx_category_id (category_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  INDEX idx_deleted_at (deleted_at)
);

CREATE TABLE IF NOT EXISTS incident_images (
  id VARCHAR(36) PRIMARY KEY,
  incident_id VARCHAR(36) NOT NULL,
  image_url VARCHAR(2000) NOT NULL,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (incident_id) REFERENCES incidents(id),
  INDEX idx_incident_id (incident_id)
);

DROP TABLE IF EXISTS incident_videos;
CREATE TABLE IF NOT EXISTS incident_videos (
  id CHAR(36) PRIMARY KEY,
  incident_id CHAR(36) NOT NULL,
  video_url TEXT NOT NULL,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_incident_id_v (incident_id),
  CONSTRAINT fk_videos_incident FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS incident_updates (
  id VARCHAR(36) PRIMARY KEY,
  incident_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (incident_id) REFERENCES incidents(id),
  FOREIGN KEY (user_id) REFERENCES profiles(id),
  INDEX idx_incident_id (incident_id),
  INDEX idx_created_at (created_at)
);

CREATE TABLE IF NOT EXISTS password_resets (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  token VARCHAR(128) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id_pr (user_id),
  INDEX idx_token_pr (token),
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT IGNORE INTO incident_categories (id, name, description, color) VALUES
('cat-001', 'Seguridad Vial', 'Accidentes y problemas de tráfico', '#EF4444'),
('cat-002', 'Servicios Públicos', 'Problemas con agua, luz, gas', '#F97316'),
('cat-003', 'Basura y Limpieza', 'Acumulación de residuos', '#EAB308'),
('cat-004', 'Alumbrado Público', 'Farolas dañadas o apagadas', '#FBBF24'),
('cat-005', 'Infraestructura', 'Baches, banquetas dañadas', '#A3E635'),
('cat-006', 'Parques y Espacios', 'Mantenimiento de áreas públicas', '#86EFAC'),
('cat-007', 'Seguridad Pública', 'Delitos e inseguridad', '#34D399'),
('cat-008', 'Mascotas', 'Animales sueltos o abandonados', '#06B6D4'),
('cat-009', 'Ruido', 'Contaminación sonora', '#0EA5E9'),
('cat-010', 'Otro', 'Otros problemas ciudadanos', '#3B82F6');