-- ============================================================
--  SCIHEALTH — Schema de base de datos (Supabase / PostgreSQL)
--  By TesJua
--  Ejecuta esto en el SQL Editor de tu proyecto Supabase
-- ============================================================

-- Tabla principal de artículos
CREATE TABLE articles (
  id                   BIGSERIAL PRIMARY KEY,
  titulo_es            TEXT NOT NULL,
  titulo_en            TEXT,
  titulo_original      TEXT,
  resumen_divulgacion  TEXT,
  resumen_divulgacion_en TEXT,
  resumen_tecnico      TEXT,
  resumen_tecnico_en   TEXT,
  categoria            TEXT CHECK (categoria IN (
    'Neurociencia','Genética','Nutrición','Oncología','Microbioma',
    'Salud mental','Cardiología','Inmunología','Divulgación','Salud global',
    'Investigación','Salud pública','Inteligencia Artificial','Tecnología',
    'Espacio','Física','Energía','Robótica','Ciencia General',
    'Efemérides'
  )),
  palabras_clave       TEXT[],
  nivel_evidencia      TEXT CHECK (nivel_evidencia IN ('preliminar','moderado','sólido')),
  source_name          TEXT,
  source_url           TEXT UNIQUE,
  source_color         TEXT DEFAULT '#1D9E75',
  published_at         TIMESTAMPTZ DEFAULT NOW(),
  status               TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_note           TEXT,
  idioma_original      TEXT DEFAULT 'en',
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas rápidas del feed
CREATE INDEX idx_articles_status      ON articles(status);
CREATE INDEX idx_articles_categoria   ON articles(categoria);
CREATE INDEX idx_articles_published   ON articles(published_at DESC);
CREATE INDEX idx_articles_source_url  ON articles(source_url);

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_articles_updated
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security (RLS) — seguridad por defecto
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Política: lectura pública solo de artículos aprobados
CREATE POLICY "public_read_approved"
  ON articles FOR SELECT
  USING (status = 'approved');

-- Política: admin puede ver y modificar todo (usa service_role key)
CREATE POLICY "admin_all"
  ON articles FOR ALL
  USING (auth.role() = 'service_role');

-- Vista para el feed público (precalcula lo necesario)
CREATE VIEW public_feed AS
  SELECT
    id, titulo_es, resumen_divulgacion, categoria,
    palabras_clave, nivel_evidencia, source_name,
    source_url, source_color, published_at
  FROM articles
  WHERE status = 'approved'
  ORDER BY published_at DESC;

-- Vista para el panel admin (todo visible)
CREATE VIEW admin_feed AS
  SELECT * FROM articles
  ORDER BY created_at DESC;

-- ============================================================
--  INSTRUCCIONES DE CONFIGURACIÓN
-- ============================================================
--
--  1. Ve a supabase.com → New Project → crea tu proyecto
--  2. Settings → API → copia:
--     · Project URL → SUPABASE_URL en pipeline.js
--     · anon public key → SUPABASE_KEY en pipeline.js (para leer)
--     · service_role key → SUPABASE_SERVICE_KEY en admin.html
--  3. SQL Editor → pega y ejecuta este archivo completo
--  4. Listo — la tabla está lista para recibir artículos
--
--  By TesJua — Ciencia y tecnología que importa
-- ============================================================
