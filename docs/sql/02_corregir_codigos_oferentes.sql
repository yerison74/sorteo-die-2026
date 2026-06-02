-- =============================================================================
-- CORRECCIÓN — oferentes_sorteo
-- ⚠️ Haga backup o ejecute primero 01_validar_codigos_oferentes.sql
-- Ejecute por secciones en Supabase → SQL Editor (no todo de una vez)
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- A) Normalizar mayúsculas en código (DIE-2026-S01-a-005 → …-A-005)
-- -----------------------------------------------------------------------------
UPDATE public.oferentes_sorteo
SET codigo = UPPER(TRIM(codigo))
WHERE codigo IS NOT NULL
  AND codigo <> UPPER(TRIM(codigo));

-- -----------------------------------------------------------------------------
-- B) Rellenar número a 3 dígitos (…-A-5 → …-A-005) solo si el patrón lo permite
-- -----------------------------------------------------------------------------
UPDATE public.oferentes_sorteo o
SET codigo =
  'DIE-2026-S01-' ||
  UPPER(SUBSTRING(o.codigo FROM 'DIE-2026-S01-([AB])-')) || '-' ||
  LPAD(SUBSTRING(o.codigo FROM 'DIE-2026-S01-[AB]-([0-9]+)$'), 3, '0')
WHERE o.codigo ~* '^DIE-2026-S01-[AB]-[0-9]{1,2}$';

-- -----------------------------------------------------------------------------
-- C) Alinear lote_habilitado con el tipo del código
-- -----------------------------------------------------------------------------
UPDATE public.oferentes_sorteo o
SET lote_habilitado = UPPER(SUBSTRING(o.codigo FROM 'DIE-2026-S01-([AB])-'))
WHERE o.codigo ~ '^DIE-2026-S01-[AB]-[0-9]{3}$'
  AND UPPER(TRIM(COALESCE(o.lote_habilitado, ''))) IS DISTINCT FROM
      UPPER(SUBSTRING(o.codigo FROM 'DIE-2026-S01-([AB])-'));

-- -----------------------------------------------------------------------------
-- D) Índice único en codigo (evita duplicados a futuro)
--     Si falla: hay duplicados → resolver con consulta 3 del script 01
-- -----------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS oferentes_sorteo_codigo_unique
  ON public.oferentes_sorteo (codigo);

-- -----------------------------------------------------------------------------
-- E) Vista auxiliar para la app / reportes
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_oferentes_codigo_parsed AS
SELECT
  id,
  codigo,
  nombre_oferente,
  rnc,
  rpe,
  lote_habilitado,
  UPPER(SUBSTRING(codigo FROM 'DIE-2026-S01-([AB])-')) AS tombola,
  (SUBSTRING(codigo FROM 'DIE-2026-S01-[AB]-([0-9]{3})'))::INT AS numero_registro,
  (codigo ~ '^DIE-2026-S01-[AB]-[0-9]{3}$') AS codigo_valido
FROM public.oferentes_sorteo;

COMMIT;

-- =============================================================================
-- F) OPCIONAL — Duplicar fila para oferente con A y B en una sola fila
--    Solo si lote_habilitado indica ambas tombolas y solo existe UN código.
--    Revise el SELECT antes de descomentar el INSERT.
-- =============================================================================

/*
-- Preview: filas que parecen estar en ambas tombolas con un solo código
SELECT *
FROM public.oferentes_sorteo
WHERE UPPER(TRIM(lote_habilitado)) IN ('AB', 'A/B', 'A,B', 'AMBOS')
   OR (lote_habilitado ~* 'A' AND lote_habilitado ~* 'B');

-- Ejemplo: si tiene código tipo A y debe existir también en B con otro número,
-- debe crearse manualmente la segunda fila con el número correcto de tombola B.
-- Plantilla (ajuste numero_registro_b y datos):

INSERT INTO public.oferentes_sorteo (codigo, lote_habilitado, nombre_oferente, rnc, rpe)
SELECT
  'DIE-2026-S01-B-' || LPAD('016', 3, '0'),  -- ← número real en tombola B
  'B',
  nombre_oferente,
  rnc,
  rpe
FROM public.oferentes_sorteo
WHERE id = 123;  -- ← id de la fila original
*/

-- =============================================================================
-- G) OPCIONAL — Sincronizar codigo_oferente en resultados con el catálogo
-- =============================================================================

/*
UPDATE public.resultados_sorteo r
SET codigo_oferente = o.codigo
FROM public.oferentes_sorteo o
WHERE r.oferente_id = o.id
  AND (r.codigo_oferente IS DISTINCT FROM o.codigo);
*/
