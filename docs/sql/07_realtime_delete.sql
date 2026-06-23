-- =====================================================
-- HABILITAR DELETE EN REALTIME
-- Necesario para que la pantalla pública se actualice
-- cuando se elimina un resultado.
-- =====================================================

-- Permite que Realtime envíe el id en eventos DELETE
ALTER TABLE public.resultados_sorteo REPLICA IDENTITY FULL;

-- Verificar que la tabla esté en la publicación
ALTER PUBLICATION supabase_realtime ADD TABLE public.resultados_sorteo;
