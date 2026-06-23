-- =============================================================================
-- VALIDACIÓN — oferentes_sorteo (solo lectura)
-- Ejecutar en Supabase → SQL Editor
-- Formato esperado: DIE-2026-S01-{A|B}-{000}
-- =============================================================================

-- 1) Resumen general
SELECT
  COUNT(*) AS total_filas,
  COUNT(*) FILTER (WHERE codigo ~ '^DIE-2026-S01-[AB]-[0-9]{3}$') AS codigos_validos,
  COUNT(*) FILTER (WHERE codigo !~ '^DIE-2026-S01-[AB]-[0-9]{3}$' OR codigo IS NULL) AS codigos_invalidos
FROM public.oferentes_sorteo;

-- 2) Códigos con formato incorrecto
SELECT id, codigo, lote_habilitado, nombre_oferente, rnc, rpe
FROM public.oferentes_sorteo
WHERE codigo IS NULL
   OR codigo !~ '^DIE-2026-S01-[AB]-[0-9]{3}$'
ORDER BY codigo NULLS FIRST, id;

-- 3) Códigos duplicados (deben ser únicos)
SELECT codigo, COUNT(*) AS veces, ARRAY_AGG(id ORDER BY id) AS ids
FROM public.oferentes_sorteo
WHERE codigo IS NOT NULL
GROUP BY codigo
HAVING COUNT(*) > 1
ORDER BY veces DESC;

-- 4) Tipo en código vs columna lote_habilitado (deben coincidir)
SELECT
  id,
  codigo,
  lote_habilitado,
  UPPER(SUBSTRING(codigo FROM 'DIE-2026-S01-([AB])-')) AS tipo_en_codigo,
  nombre_oferente
FROM public.oferentes_sorteo
WHERE codigo ~ '^DIE-2026-S01-[AB]-[0-9]{3}$'
  AND UPPER(TRIM(COALESCE(lote_habilitado, ''))) IS DISTINCT FROM
      UPPER(SUBSTRING(codigo FROM 'DIE-2026-S01-([AB])-'))
ORDER BY codigo;

-- 5) Secuencia por tombola (huecos y duplicados de número)
WITH parsed AS (
  SELECT
    id,
    codigo,
    UPPER(SUBSTRING(codigo FROM 'DIE-2026-S01-([AB])-')) AS tombola,
    (SUBSTRING(codigo FROM 'DIE-2026-S01-[AB]-([0-9]{3})'))::INT AS numero_registro
  FROM public.oferentes_sorteo
  WHERE codigo ~ '^DIE-2026-S01-[AB]-[0-9]{3}$'
),
ranked AS (
  SELECT
    *,
    ROW_NUMBER() OVER (PARTITION BY tombola ORDER BY numero_registro, id) AS orden_esperado,
    numero_registro - ROW_NUMBER() OVER (PARTITION BY tombola ORDER BY numero_registro, id) AS gap_check
  FROM parsed
)
SELECT tombola, numero_registro, codigo, id, orden_esperado
FROM ranked
WHERE numero_registro <> orden_esperado  -- numeración no consecutiva desde 1
ORDER BY tombola, numero_registro;

-- 6) Mismo RNC/RPE con varios códigos (normal si está en A y en B)
SELECT
  COALESCE(NULLIF(TRIM(rnc), ''), NULLIF(TRIM(rpe), ''), 'SIN-ID') AS identidad,
  COUNT(*) AS filas,
  ARRAY_AGG(codigo ORDER BY codigo) AS codigos,
  ARRAY_AGG(DISTINCT UPPER(TRIM(lote_habilitado))) AS habilitados
FROM public.oferentes_sorteo
GROUP BY 1
HAVING COUNT(*) > 1
ORDER BY filas DESC, identidad
LIMIT 100;

-- 7) Posible inscripción dual en una sola fila (revisar manualmente)
SELECT id, codigo, lote_habilitado, nombre_oferente, rnc
FROM public.oferentes_sorteo
WHERE UPPER(TRIM(lote_habilitado)) IN ('AB', 'A/B', 'A,B', 'AMBOS', 'A Y B', 'AYB')
   OR lote_habilitado ~* '.*A.*B.*';

-- 8) Ganadores principales y sus códigos (cruzado con resultados)
SELECT
  r.id AS resultado_id,
  r.posicion,
  l.numero_lote,
  l.tipo AS tombola_lote,
  r.nombre_oferente,
  r.codigo_oferente AS codigo_en_resultado,
  o.codigo AS codigo_en_catalogo,
  o.lote_habilitado
FROM public.resultados_sorteo r
JOIN public.lotes l ON l.id = r.lote_id
LEFT JOIN public.oferentes_sorteo o ON o.id = r.oferente_id
WHERE r.posicion = 1
ORDER BY l.numero_lote;

-- 9) Resultados cuyo código no existe en catálogo
SELECT r.id, r.codigo_oferente, r.nombre_oferente, r.lote_id
FROM public.resultados_sorteo r
LEFT JOIN public.oferentes_sorteo o ON o.codigo = r.codigo_oferente
WHERE o.id IS NULL;
