-- =============================================================================
-- Función opcional en Supabase: impedir ganador principal repetido (misma persona)
-- Complementa la validación del Panel Operador en React.
-- Identifica persona por RNC, luego RPE, luego oferente_id.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.fn_persona_ya_gano_principal(
  p_oferente_id UUID,
  p_rnc TEXT,
  p_rpe TEXT,
  p_lote_id UUID DEFAULT NULL
)
RETURNS TABLE (
  bloqueado BOOLEAN,
  nombre_ganador TEXT,
  numero_lote INT,
  tombola TEXT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    TRUE AS bloqueado,
    r.nombre_oferente AS nombre_ganador,
    l.numero_lote,
    UPPER(l.tipo::TEXT) AS tombola
  FROM public.resultados_sorteo r
  JOIN public.lotes l ON l.id = r.lote_id
  WHERE r.posicion = 1
    AND (p_lote_id IS NULL OR r.lote_id IS DISTINCT FROM p_lote_id)
    AND (
      r.oferente_id = p_oferente_id
      OR (
        NULLIF(TRIM(p_rnc), '') IS NOT NULL
        AND NULLIF(TRIM(r.rnc), '') IS NOT NULL
        AND TRIM(r.rnc) = TRIM(p_rnc)
      )
      OR (
        NULLIF(TRIM(p_rpe), '') IS NOT NULL
        AND NULLIF(TRIM(r.rpe), '') IS NOT NULL
        AND TRIM(r.rpe) = TRIM(p_rpe)
      )
    )
  LIMIT 1;
END;
$$;

-- Prueba:
-- SELECT * FROM public.fn_persona_ya_gano_principal(1, '123456789', 'RPE-001', NULL);

-- Trigger opcional al insertar resultado (descomentar si desea bloqueo en BD):

/*
CREATE OR REPLACE FUNCTION public.trg_resultados_sin_reganador_principal()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_prev RECORD;
BEGIN
  IF NEW.posicion <> 1 THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_prev
  FROM public.fn_persona_ya_gano_principal(NEW.oferente_id, NEW.rnc, NEW.rpe, NEW.lote_id);

  IF FOUND AND v_prev.bloqueado THEN
    RAISE EXCEPTION 'El oferente % ya gano en el lote % de la tombola %.',
      v_prev.nombre_ganador,
      LPAD(v_prev.numero_lote::TEXT, 2, '0'),
      v_prev.tombola;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS resultados_sin_reganador_principal ON public.resultados_sorteo;

CREATE TRIGGER resultados_sin_reganador_principal
  BEFORE INSERT ON public.resultados_sorteo
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_resultados_sin_reganador_principal();
*/
