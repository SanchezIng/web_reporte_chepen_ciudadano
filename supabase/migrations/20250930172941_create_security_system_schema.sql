/*
  # Sistema de Seguridad Ciudadana - Municipalidad Provincial de Chepén
  
  ## Descripción
  Este migration crea la estructura base de datos para el sistema de gestión de incidencias
  de seguridad ciudadana, cumpliendo con los requisitos funcionales y no funcionales del proyecto.
  
  ## 1. Nuevas Tablas
  
  ### `profiles`
  Tabla que extiende la información de usuarios de Supabase auth.users
  - `id` (uuid, PK): Vinculado con auth.users
  - `email` (text): Correo electrónico del usuario
  - `full_name` (text): Nombre completo
  - `phone` (text): Teléfono de contacto (opcional)
  - `role` (text): Rol del usuario ('citizen' o 'authority')
  - `created_at` (timestamptz): Fecha de creación
  - `updated_at` (timestamptz): Fecha de actualización
  
  ### `incident_categories`
  Catálogo de tipos/categorías de incidencias
  - `id` (uuid, PK): Identificador único
  - `name` (text): Nombre de la categoría (robo, accidente, disturbio, etc.)
  - `description` (text): Descripción de la categoría
  - `color` (text): Color para visualización en UI
  - `created_at` (timestamptz): Fecha de creación
  
  ### `incidents`
  Tabla principal para registro de incidencias
  - `id` (uuid, PK): Identificador único
  - `user_id` (uuid, FK): Usuario que reporta (ciudadano)
  - `category_id` (uuid, FK): Categoría de la incidencia
  - `title` (text): Título breve de la incidencia
  - `description` (text): Descripción detallada
  - `latitude` (decimal): Coordenada latitud (geolocalización)
  - `longitude` (decimal): Coordenada longitud (geolocalización)
  - `address` (text): Dirección textual
  - `status` (text): Estado ('pending', 'in_progress', 'resolved', 'rejected')
  - `priority` (text): Prioridad ('low', 'medium', 'high', 'urgent')
  - `incident_date` (timestamptz): Fecha/hora del incidente reportado
  - `created_at` (timestamptz): Fecha de registro en sistema
  - `updated_at` (timestamptz): Última actualización
  - `resolved_at` (timestamptz): Fecha de resolución (nullable)
  - `resolved_by` (uuid, FK): Autoridad que resolvió (nullable)
  
  ### `incident_images`
  Evidencias fotográficas de incidencias
  - `id` (uuid, PK): Identificador único
  - `incident_id` (uuid, FK): Incidencia asociada
  - `image_url` (text): URL de la imagen almacenada
  - `uploaded_at` (timestamptz): Fecha de carga
  
  ### `incident_updates`
  Historial de actualizaciones y seguimiento de incidencias
  - `id` (uuid, PK): Identificador único
  - `incident_id` (uuid, FK): Incidencia asociada
  - `user_id` (uuid, FK): Usuario que actualiza (autoridad)
  - `old_status` (text): Estado anterior
  - `new_status` (text): Estado nuevo
  - `comment` (text): Comentario de la actualización
  - `created_at` (timestamptz): Fecha del cambio
  
  ## 2. Seguridad (RLS - Row Level Security)
  
  ### Políticas implementadas:
  - **profiles**: Los usuarios pueden ver y actualizar solo su propio perfil
  - **incident_categories**: Lectura pública, solo autoridades pueden modificar
  - **incidents**: Ciudadanos ven sus propios reportes, autoridades ven todos
  - **incident_images**: Acceso vinculado a permisos de incidents
  - **incident_updates**: Solo autoridades pueden crear, lectura según permisos de incident
  
  ## 3. Índices
  - Índices en claves foráneas para optimizar joins
  - Índices en campos de búsqueda frecuente (status, category_id, user_id)
  - Índices en campos de fecha para filtros temporales
  
  ## 4. Datos Iniciales
  Se insertan categorías predefinidas de incidencias comunes en seguridad ciudadana
*/

-- Habilitar extensión para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLA: profiles
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  phone text,
  role text NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'authority')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- TABLA: incident_categories
-- =====================================================
CREATE TABLE IF NOT EXISTS incident_categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  description text,
  color text DEFAULT '#3B82F6',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE incident_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories"
  ON incident_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only authorities can insert categories"
  ON incident_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'authority'
    )
  );

CREATE POLICY "Only authorities can update categories"
  ON incident_categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'authority'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'authority'
    )
  );

-- =====================================================
-- TABLA: incidents
-- =====================================================
CREATE TABLE IF NOT EXISTS incidents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES incident_categories(id),
  title text NOT NULL,
  description text NOT NULL,
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  address text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'rejected')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  incident_date timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES profiles(id)
);

ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Citizens can view own incidents"
  ON incidents FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'authority'
    )
  );

CREATE POLICY "Citizens can insert own incidents"
  ON incidents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Citizens can update own pending incidents"
  ON incidents FOR UPDATE
  TO authenticated
  USING (
    (auth.uid() = user_id AND status = 'pending')
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'authority'
    )
  )
  WITH CHECK (
    (auth.uid() = user_id AND status = 'pending')
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'authority'
    )
  );

CREATE POLICY "Citizens can delete own pending incidents"
  ON incidents FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending');

-- =====================================================
-- TABLA: incident_images
-- =====================================================
CREATE TABLE IF NOT EXISTS incident_images (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id uuid NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  uploaded_at timestamptz DEFAULT now()
);

ALTER TABLE incident_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view images of accessible incidents"
  ON incident_images FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM incidents
      WHERE incidents.id = incident_images.incident_id
      AND (
        incidents.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'authority'
        )
      )
    )
  );

CREATE POLICY "Users can insert images for own incidents"
  ON incident_images FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM incidents
      WHERE incidents.id = incident_images.incident_id
      AND incidents.user_id = auth.uid()
    )
  );

-- =====================================================
-- TABLA: incident_updates
-- =====================================================
CREATE TABLE IF NOT EXISTS incident_updates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id uuid NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id),
  old_status text,
  new_status text NOT NULL,
  comment text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE incident_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view updates of accessible incidents"
  ON incident_updates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM incidents
      WHERE incidents.id = incident_updates.incident_id
      AND (
        incidents.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'authority'
        )
      )
    )
  );

CREATE POLICY "Only authorities can insert updates"
  ON incident_updates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'authority'
    )
  );

-- =====================================================
-- ÍNDICES para optimización
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_incidents_user_id ON incidents(user_id);
CREATE INDEX IF NOT EXISTS idx_incidents_category_id ON incidents(category_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at);
CREATE INDEX IF NOT EXISTS idx_incidents_incident_date ON incidents(incident_date);
CREATE INDEX IF NOT EXISTS idx_incident_images_incident_id ON incident_images(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_updates_incident_id ON incident_updates(incident_id);

-- =====================================================
-- DATOS INICIALES: Categorías de incidencias
-- =====================================================
INSERT INTO incident_categories (name, description, color) VALUES
  ('Robo', 'Robos y hurtos en la vía pública', '#EF4444'),
  ('Accidente de Tránsito', 'Accidentes vehiculares y de tránsito', '#F59E0B'),
  ('Disturbio Público', 'Alteraciones del orden público, peleas, escándalos', '#8B5CF6'),
  ('Vandalismo', 'Daños a propiedad pública o privada', '#EC4899'),
  ('Emergencia Médica', 'Situaciones que requieren atención médica urgente', '#10B981'),
  ('Violencia Familiar', 'Casos de violencia doméstica', '#DC2626'),
  ('Venta de Drogas', 'Comercialización ilegal de sustancias', '#991B1B'),
  ('Acoso Callejero', 'Situaciones de acoso en espacios públicos', '#F97316'),
  ('Ruidos Molestos', 'Contaminación sonora excesiva', '#06B6D4'),
  ('Iluminación Deficiente', 'Zonas sin alumbrado público adecuado', '#6366F1'),
  ('Otro', 'Otros tipos de incidencias', '#6B7280')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- FUNCIÓN: Actualizar timestamp automáticamente
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para tabla profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para tabla incidents
DROP TRIGGER IF EXISTS update_incidents_updated_at ON incidents;
CREATE TRIGGER update_incidents_updated_at
  BEFORE UPDATE ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();