-- ════════════════════════════════════════════════════════════════════════════
-- MIGRACIÓN: Soporte multi-sorteo
-- Sistema: Sorteo DIE 2026
-- SEGURO: no elimina ni modifica datos existentes.
--         El sorteo DIE-2026-S01 queda como sorteo_id = 1.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. Tabla maestra de sorteos ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sorteos (
  id          SERIAL PRIMARY KEY,
  nombre      TEXT NOT NULL UNIQUE,        -- ej: "DIE-2026-S01"
  descripcion TEXT,
  activo      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Registrar el sorteo histórico existente con id=1
INSERT INTO sorteos (id, nombre, descripcion, activo)
VALUES (1, 'DIE-2026-S01', 'Sorteo original — datos históricos protegidos', false)
ON CONFLICT (id) DO NOTHING;

-- Avanzar la secuencia para que el próximo auto-id sea 2
SELECT setval(pg_get_serial_sequence('sorteos','id'), GREATEST(1, (SELECT MAX(id) FROM sorteos)));


-- ── 2. Agregar sorteo_id a cada tabla operativa ──────────────────────────
--   DEFAULT 1 → toda la data existente pertenece automáticamente al sorteo 1

ALTER TABLE lotes
  ADD COLUMN IF NOT EXISTS sorteo_id INT NOT NULL DEFAULT 1
  REFERENCES sorteos(id);

ALTER TABLE items_lote
  ADD COLUMN IF NOT EXISTS sorteo_id INT NOT NULL DEFAULT 1
  REFERENCES sorteos(id);

ALTER TABLE oferentes_sorteo
  ADD COLUMN IF NOT EXISTS sorteo_id INT NOT NULL DEFAULT 1
  REFERENCES sorteos(id);

ALTER TABLE resultados_sorteo
  ADD COLUMN IF NOT EXISTS sorteo_id INT NOT NULL DEFAULT 1
  REFERENCES sorteos(id);


-- ── 3. Actualizar las filas existentes al sorteo 1 (por si acaso) ────────
UPDATE lotes              SET sorteo_id = 1 WHERE sorteo_id IS NULL;
UPDATE items_lote         SET sorteo_id = 1 WHERE sorteo_id IS NULL;
UPDATE oferentes_sorteo   SET sorteo_id = 1 WHERE sorteo_id IS NULL;
UPDATE resultados_sorteo  SET sorteo_id = 1 WHERE sorteo_id IS NULL;


-- ── 4. Índices de rendimiento ────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_lotes_sorteo              ON lotes             (sorteo_id);
CREATE INDEX IF NOT EXISTS idx_items_lote_sorteo         ON items_lote        (sorteo_id);
CREATE INDEX IF NOT EXISTS idx_oferentes_sorteo          ON oferentes_sorteo  (sorteo_id);
CREATE INDEX IF NOT EXISTS idx_resultados_sorteo_sid     ON resultados_sorteo (sorteo_id);


-- ── 5. Ampliar sorteo_estado para guardar el sorteo activo de la sesión ──
ALTER TABLE sorteo_estado
  ADD COLUMN IF NOT EXISTS sorteo_activo_id INT REFERENCES sorteos(id);

-- El registro id=1 ya existe; asignamos el sorteo 1 como referencia inicial
UPDATE sorteo_estado SET sorteo_activo_id = 1 WHERE id = 1 AND sorteo_activo_id IS NULL;


-- ── 6. Función auxiliar: siguiente nombre automático DIE-2026-S## ────────
CREATE OR REPLACE FUNCTION siguiente_nombre_sorteo()
RETURNS TEXT
LANGUAGE sql STABLE AS $$
  SELECT 'DIE-2026-S' || LPAD(
    (COALESCE(
      MAX(SUBSTRING(nombre FROM '^DIE-2026-S(\d+)$')::INT),
      0
    ) + 1)::TEXT,
    2, '0'
  )
  FROM sorteos
  WHERE nombre ~ '^DIE-2026-S\d+$';
$$;

-- Prueba rápida (debería devolver DIE-2026-S02)
SELECT siguiente_nombre_sorteo();


-- ── 7. Protección: el sorteo 1 no se puede modificar ni borrar ──────────
--   (Opcional — recomendado para integridad del histórico)
CREATE OR REPLACE FUNCTION proteger_sorteo_historico()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.id = 1 THEN
    RAISE EXCEPTION 'El sorteo DIE-2026-S01 es histórico y no puede modificarse ni eliminarse.';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS tg_proteger_sorteo1_update ON sorteos;
CREATE TRIGGER tg_proteger_sorteo1_update
  BEFORE UPDATE ON sorteos
  FOR EACH ROW EXECUTE FUNCTION proteger_sorteo_historico();

DROP TRIGGER IF EXISTS tg_proteger_sorteo1_delete ON sorteos;
CREATE TRIGGER tg_proteger_sorteo1_delete
  BEFORE DELETE ON sorteos
  FOR EACH ROW EXECUTE FUNCTION proteger_sorteo_historico();


-- ════════════════════════════════════════════════════════════════════════════
-- FIN DE MIGRACIÓN
-- Verificación post-migración:
--   SELECT * FROM sorteos;
--   SELECT sorteo_id, COUNT(*) FROM lotes GROUP BY sorteo_id;
--   SELECT sorteo_id, COUNT(*) FROM oferentes_sorteo GROUP BY sorteo_id;
--   SELECT sorteo_id, COUNT(*) FROM resultados_sorteo GROUP BY sorteo_id;
-- ════════════════════════════════════════════════════════════════════════════
