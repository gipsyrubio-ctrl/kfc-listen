-- ══════════════════════════════════════════════════════════
--  KFC Listen · Script SQL para Supabase
--  Copiar y pegar completo en Supabase > SQL Editor > Run
-- ══════════════════════════════════════════════════════════

-- ── Tabla: sesiones anónimas ──────────────────────────────
CREATE TABLE IF NOT EXISTS survey_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area          VARCHAR(100),
  tenure_range  VARCHAR(50),
  anon_token    VARCHAR(64) UNIQUE NOT NULL,
  completed     BOOLEAN DEFAULT false,
  started_at    TIMESTAMPTZ DEFAULT NOW(),
  completed_at  TIMESTAMPTZ
);

-- ── Tabla: respuestas ────────────────────────────────────
CREATE TABLE IF NOT EXISTS responses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID REFERENCES survey_sessions(id) ON DELETE CASCADE,
  section_id      INTEGER NOT NULL,
  question_index  INTEGER NOT NULL,
  question_type   VARCHAR(20) NOT NULL,
  likert_value    INTEGER CHECK (likert_value BETWEEN 1 AND 5),
  nps_value       INTEGER CHECK (nps_value BETWEEN 0 AND 10),
  open_text       TEXT,
  selected_option TEXT,
  answered_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── Índices para rendimiento ──────────────────────────────
CREATE INDEX IF NOT EXISTS idx_responses_session   ON responses(session_id);
CREATE INDEX IF NOT EXISTS idx_responses_section   ON responses(section_id);
CREATE INDEX IF NOT EXISTS idx_sessions_area       ON survey_sessions(area);
CREATE INDEX IF NOT EXISTS idx_sessions_completed  ON survey_sessions(completed);

-- ── Seguridad: Row Level Security (RLS) ──────────────────
ALTER TABLE survey_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses       ENABLE ROW LEVEL SECURITY;

-- Cualquier persona puede INSERT en survey_sessions (encuesta pública anónima)
CREATE POLICY "insert_sessions" ON survey_sessions
  FOR INSERT TO anon WITH CHECK (true);

-- Cualquier persona puede INSERT en responses (anónimo)
CREATE POLICY "insert_responses" ON responses
  FOR INSERT TO anon WITH CHECK (true);

-- Solo usuarios autenticados (RRHH) pueden UPDATE survey_sessions
CREATE POLICY "update_own_session" ON survey_sessions
  FOR UPDATE TO anon USING (true);

-- Solo usuarios autenticados pueden leer todo
CREATE POLICY "read_sessions_auth" ON survey_sessions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "read_responses_auth" ON responses
  FOR SELECT TO authenticated USING (true);

-- ── Vista: engagement por área (para el dashboard) ───────
CREATE OR REPLACE VIEW vw_engagement_by_area AS
SELECT
  s.area,
  COUNT(DISTINCT s.id)                                                    AS total_sessions,
  ROUND(((AVG(r.likert_value) FILTER (
    WHERE r.section_id = 1 AND r.question_type = 'likert'
  ) - 1) / 4.0) * 100, 1)                                                AS engagement_score,
  ROUND(
    COUNT(*) FILTER (WHERE r.likert_value IN (4,5))::NUMERIC /
    NULLIF(COUNT(*) FILTER (WHERE r.likert_value IS NOT NULL), 0) * 100
  , 1)                                                                    AS favorability_pct
FROM survey_sessions s
LEFT JOIN responses r ON r.session_id = s.id
WHERE s.completed = true
GROUP BY s.area
HAVING COUNT(DISTINCT s.id) >= 1;

-- ── Vista: respuestas abiertas para análisis IA ───────────
CREATE OR REPLACE VIEW vw_open_responses AS
SELECT
  s.area,
  s.tenure_range,
  r.section_id,
  r.question_index,
  r.open_text
FROM responses r
JOIN survey_sessions s ON s.id = r.session_id
WHERE r.question_type = 'open'
  AND r.open_text IS NOT NULL
  AND LENGTH(TRIM(r.open_text)) > 10
ORDER BY r.answered_at DESC;
