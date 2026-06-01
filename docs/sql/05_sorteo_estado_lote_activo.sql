-- =============================================================================
-- Lote activo del sorteo (sincroniza Panel Operador → Pantalla Pública + QR)
-- Una sola fila id = 1
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.sorteo_estado (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  lote_activo_id BIGINT REFERENCES public.lotes(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.sorteo_estado (id, lote_activo_id)
VALUES (1, NULL)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.sorteo_estado ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sorteo_estado_anon_all" ON public.sorteo_estado;
CREATE POLICY "sorteo_estado_anon_all"
  ON public.sorteo_estado FOR ALL
  USING (true) WITH CHECK (true);

-- Realtime: cambios al seleccionar lote en operador
ALTER PUBLICATION supabase_realtime ADD TABLE public.sorteo_estado;

-- Si ya estaba en la publicación, ignore el error.
