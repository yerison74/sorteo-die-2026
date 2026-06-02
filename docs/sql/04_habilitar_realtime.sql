-- =============================================================================
-- Habilitar Realtime en resultados_sorteo (Supabase)
-- Sin esto, el celular (QR /info) no recibe cambios al instante.
-- Dashboard → Database → Replication → supabase_realtime
-- O ejecute este script si tiene permisos.
-- =============================================================================

-- Incluir tabla en la publicación realtime (Postgres 15+ / Supabase)
ALTER PUBLICATION supabase_realtime ADD TABLE public.resultados_sorteo;

-- Si el comando anterior falla porque ya está incluida, puede ignorar el error.

-- Verificar tablas en la publicación:
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
