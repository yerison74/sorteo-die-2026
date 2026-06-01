import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, db } from '../services/supabase';
import {
  broadcastSorteoUpdate,
  broadcastLoteActivo,
  subscribeSorteoUpdates,
  LOTE_ACTIVO_STORAGE_KEY,
} from '../services/sync';
import { resolveLoteEnVivo } from '../utils';

const POLL_MS = Number(process.env.REACT_APP_SYNC_POLL_MS) || 8000;

function sortResultados(rows) {
  return [...rows].sort((a, b) => {
    if (a.lote_id !== b.lote_id) return a.lote_id - b.lote_id;
    return a.posicion - b.posicion;
  });
}

function mergeResultado(list, row) {
  if (!row) return list;
  const without = list.filter(
    (r) =>
      !(
        r.lote_id === row.lote_id &&
        r.posicion === row.posicion &&
        r.id !== row.id
      )
  );
  if (row.id && without.some((r) => r.id === row.id)) return sortResultados(without);
  return sortResultados([...without, row]);
}

export function useAppData() {
  const [lotes, setLotes] = useState([]);
  const [items, setItems] = useState([]);
  const [oferentes, setOferentes] = useState([]);
  const [resultados, setResultados] = useState([]);
  const [loteActivoId, setLoteActivoId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const [errors, setErrors] = useState({});
  const mountedRef = useRef(true);

  const applyLoteActivoId = useCallback((id) => {
    setLoteActivoId(id ?? null);
    try {
      if (id == null) localStorage.removeItem(LOTE_ACTIVO_STORAGE_KEY);
      else localStorage.setItem(LOTE_ACTIVO_STORAGE_KEY, String(id));
    } catch {
      /* ignore */
    }
  }, []);

  const fetchSorteoEstado = useCallback(async () => {
    const { data, error } = await db.getSorteoEstado();
    if (!mountedRef.current) return;
    if (!error && data) {
      applyLoteActivoId(data.lote_activo_id ?? null);
      return;
    }
    try {
      const stored = localStorage.getItem(LOTE_ACTIVO_STORAGE_KEY);
      if (stored) applyLoteActivoId(stored);
    } catch {
      /* ignore */
    }
  }, [applyLoteActivoId]);

  const setLoteActivo = useCallback(
    async (lote) => {
      const id = lote?.id ?? null;
      applyLoteActivoId(id);
      broadcastLoteActivo(id);
      const { error } = await db.setLoteActivo(id);
      if (error) {
        console.warn('[sorteo] sorteo_estado:', error.message);
      }
    },
    [applyLoteActivoId]
  );

  const fetchResultados = useCallback(async () => {
    const { data, error } = await db.getResultados();
    if (!mountedRef.current) return { error };
    if (error) {
      setErrors((prev) => ({ ...prev, resultados: error.message }));
      return { error };
    }
    setResultados(data || []);
    setLastSyncAt(new Date());
    setErrors((prev) => {
      const next = { ...prev };
      delete next.resultados;
      return next;
    });
    return { data };
  }, []);

  const loadAll = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    else setSyncing(true);

    const newErrors = {};

    const { data: l, error: e1 } = await db.getLotes();
    if (!mountedRef.current) return;
    if (e1) newErrors.lotes = e1.message;
    else setLotes(l || []);

    const { data: it, error: e2 } = await db.getAllItems();
    if (!mountedRef.current) return;
    if (e2) newErrors.items = e2.message;
    else setItems(it || []);

    const { data: of, error: e3 } = await db.getOferentes();
    if (!mountedRef.current) return;
    if (e3) newErrors.oferentes = e3.message;
    else setOferentes(of || []);

    const resR = await fetchResultados();
    if (resR?.error) newErrors.resultados = resR.error;

    await fetchSorteoEstado();

    if (!mountedRef.current) return;
    setErrors(newErrors);
    if (!silent) setLoading(false);
    setSyncing(false);
  }, [fetchResultados, fetchSorteoEstado]);

  /** Tras registrar / eliminar: actualización inmediata en todas las vistas */
  const refresh = useCallback(
    async (optimisticRow = null) => {
      if (optimisticRow) {
        setResultados((prev) => mergeResultado(prev, optimisticRow));
        setLastSyncAt(new Date());
      }
      setSyncing(true);
      broadcastSorteoUpdate();
      await fetchResultados();
      if (mountedRef.current) setSyncing(false);
      broadcastSorteoUpdate();
    },
    [fetchResultados]
  );

  const refreshSilent = useCallback(() => {
    loadAll({ silent: true });
  }, [loadAll]);

  useEffect(() => {
    mountedRef.current = true;
    loadAll({ silent: false });
    return () => {
      mountedRef.current = false;
    };
  }, [loadAll]);

  // Supabase Realtime — resultados + lote activo
  useEffect(() => {
    const channel = supabase
      .channel('sorteo-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'resultados_sorteo' },
        () => fetchResultados()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sorteo_estado' },
        () => fetchSorteoEstado()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchResultados, fetchSorteoEstado]);

  // Misma PC, varias pestañas (Dashboard + Público + Operador)
  useEffect(() => {
    return subscribeSorteoUpdates({
      onRefresh: fetchResultados,
      onLoteActivo: (id) => applyLoteActivoId(id),
    });
  }, [fetchResultados, applyLoteActivoId]);

  // Respaldo si Realtime no está habilitado en Supabase
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === 'visible') {
        fetchResultados();
        fetchSorteoEstado();
      }
    };
    const id = setInterval(tick, POLL_MS);
    return () => clearInterval(id);
  }, [fetchResultados, fetchSorteoEstado]);

  const errorMsg = Object.entries(errors)
    .map(([t, m]) => `[${t}]: ${m}`)
    .join(' | ');

  const loteActivo = resolveLoteEnVivo(lotes, loteActivoId, resultados);

  return {
    lotes,
    items,
    oferentes,
    resultados,
    loteActivoId,
    loteActivo,
    setLoteActivo,
    loading,
    syncing,
    lastSyncAt,
    error: errorMsg || null,
    refresh,
    refreshSilent,
  };
}
