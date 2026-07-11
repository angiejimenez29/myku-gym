-- 1. Crear la tabla de Administradores
CREATE TABLE admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.  Activar las políticas de seguridad (RLS) para la nueva tabla
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los admins pueden ver su propio perfil" 
ON admins FOR SELECT 
USING (auth.uid() = id);