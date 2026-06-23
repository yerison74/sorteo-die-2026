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

// ── NEW: remove a result from state by id immediately ─────────────────────
function removeResultado(list, id) {
  return list.filter((r) => r.id !== id);
}

export function useAppData(sorteoId) {
  const [lotes,       setLotes]       = useState([]);
  const [items,       setItems]       = useState([]);
  const [oferentes,   setOferentes]   = useState([]);
  const [resultados,  setResultados]  = useState([]);
  const [loteActivoId,setLoteActivoId]= useState(null);
  const [estadoLoaded,setEstadoLoaded]= useState(false); // true once Supabase estado is fetched
  const [loading,     setLoading]     = useState(true);
  const [syncing,     setSyncing]     = useState(false);
  const [lastSyncAt,  setLastSyncAt]  = useState(null);
  const [errors,      setErrors]      = useState({});
  const mountedRef = useRef(true);

  const applyLoteActivoId = useCallback((id) => {
    setLoteActivoId(id ?? null);
    try {
      // Keep localStorage only as cross-tab fallback, not as initial state
      if (id == null) localStorage.removeItem(LOTE_ACTIVO_STORAGE_KEY);
      else localStorage.setItem(LOTE_ACTIVO_STORAGE_KEY, String(id));
    } catch { /* ignore */ }
  }, []);

  const fetchSorteoEstado = useCallback(async () => {
    const { data, error } = await db.getSorteoEstado();
    if (!mountedRef.current) return;
    if (!error) {
      // Always trust Supabase — if null, clear the lote activo
      applyLoteActivoId(data?.lote_activo_id ?? null);
      if (mountedRef.current) setEstadoLoaded(true);
      return;
    }
    // Only use localStorage as fallback when Supabase itself fails (network error)
    try {
      const stored = localStorage.getItem(LOTE_ACTIVO_STORAGE_KEY);
      if (stored) applyLoteActivoId(Number(stored));
    } catch { /* ignore */ }
    if (mountedRef.current) setEstadoLoaded(true);
  }, [applyLoteActivoId]);

  const setLoteActivo = useCallback(async (lote) => {
    const id = lote?.id ?? null;

    // 1. Update local state immediately (optimistic)
    applyLoteActivoId(id);
    broadcastLoteActivo(id);

    // 2. Persist to Supabase — retry once on failure
    const tryWrite = async () => {
      const { error } = await db.setLoteActivo(id);
      if (error) {
        console.warn('[sorteo] sorteo_estado write failed, retrying:', error.message);
        await new Promise(r => setTimeout(r, 800));
        const { error: error2 } = await db.setLoteActivo(id);
        if (error2) console.error('[sorteo] sorteo_estado write failed after retry:', error2.message);
      }
    };
    tryWrite();

    // 3. Re-fetch after short delay to confirm Supabase has the new value
    setTimeout(() => {
      if (mountedRef.current) fetchSorteoEstado();
    }, 1200);
  }, [applyLoteActivoId, fetchSorteoEstado]);

  const fetchResultados = useCallback(async () => {
    if (!sorteoId) return { data: [] };
    const { data, error } = await db.getResultados(sorteoId);
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
  }, [sorteoId]);

  const loadAll = useCallback(async ({ silent = false } = {}) => {
    if (!sorteoId) {
      setLoading(false);
      setErrors({});
      setLotes([]);
      setItems([]);
      setOferentes([]);
      setResultados([]);
      return;
    }
    if (!silent) setLoading(true);
    else setSyncing(true);

    const newErrors = {};

    const { data: l, error: e1 } = await db.getLotes(sorteoId);
    if (!mountedRef.current) return;
    if (e1) newErrors.lotes = e1.message;
    else setLotes(l || []);

    const { data: it, error: e2 } = await db.getAllItems(sorteoId);
    if (!mountedRef.current) return;
    if (e2) newErrors.items = e2.message;
    else setItems(it || []);

    const { data: of, error: e3 } = await db.getOferentes(sorteoId);
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
  }, [fetchResultados, fetchSorteoEstado, sorteoId]);

  /** Registro nuevo: optimista + sync */
  const refresh = useCallback(async (optimisticRow = null) => {
    if (optimisticRow) {
      setResultados((prev) => mergeResultado(prev, optimisticRow));
      setLastSyncAt(new Date());
    }
    setSyncing(true);
    broadcastSorteoUpdate();
    await fetchResultados();
    if (mountedRef.current) setSyncing(false);
    broadcastSorteoUpdate();
  }, [fetchResultados]);

  /** Eliminación: quitar del estado INMEDIATAMENTE + sync ── FIX ── */
  const refreshAfterDelete = useCallback(async (deletedId) => {
    // 1. Remove from local state immediately — no waiting
    if (deletedId != null) {
      setResultados((prev) => removeResultado(prev, deletedId));
      setLastSyncAt(new Date());
    }
    // 2. Broadcast so other tabs/windows update too
    broadcastSorteoUpdate();
    // 3. Confirm with DB
    setSyncing(true);
    await fetchResultados();
    if (mountedRef.current) setSyncing(false);
    broadcastSorteoUpdate();
  }, [fetchResultados]);

  const refreshSilent = useCallback(() => {
    loadAll({ silent: true });
  }, [loadAll]);

  useEffect(() => {
    mountedRef.current = true;
    if (sorteoId) loadAll({ silent: false });
    else setLoading(false);
    return () => { mountedRef.current = false; };
  }, [loadAll, sorteoId]);

  // Supabase Realtime — INSERT/UPDATE/DELETE on resultados + sorteo_estado
  useEffect(() => {
    if (!sorteoId) return; // No suscribir si no hay sorteo seleccionado
    const channel = supabase
      .channel('sorteo-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'resultados_sorteo' },
        () => fetchResultados()
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'resultados_sorteo' },
        () => fetchResultados()
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'resultados_sorteo' },
        (payload) => {
          // payload.old.id is available when REPLICA IDENTITY FULL is set
          const deletedId = payload?.old?.id;
          if (deletedId) {
            setResultados((prev) => removeResultado(prev, deletedId));
            setLastSyncAt(new Date());
          } else {
            // Fallback: full fetch if id not available
            fetchResultados();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sorteo_estado' },
        () => fetchSorteoEstado()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchResultados, fetchSorteoEstado, sorteoId]);

  // Cross-tab sync (same machine, multiple browser tabs)
  useEffect(() => {
    return subscribeSorteoUpdates({
      onRefresh:   fetchResultados,
      onLoteActivo: (id) => applyLoteActivoId(id),
    });
  }, [fetchResultados, applyLoteActivoId]);

  // Polling fallback if Realtime is not enabled in Supabase
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === 'visible' && sorteoId) {
        fetchResultados();
        fetchSorteoEstado();
      }
    };
    const id = setInterval(tick, POLL_MS);
    return () => clearInterval(id);
  }, [fetchResultados, fetchSorteoEstado, sorteoId]);

  // Faster poll for sorteo_estado only (lote activo changes must feel instant)
  // Runs every 2s independently of the main POLL_MS
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible' && mountedRef.current && sorteoId) {
        fetchSorteoEstado();
      }
    }, 2000);
    return () => clearInterval(id);
  }, [fetchSorteoEstado, sorteoId]);

  const errorMsg = Object.entries(errors)
    .map(([t, m]) => `[${t}]: ${m}`)
    .join(' | ');

  // Do NOT resolve loteActivo until we have confirmed the state from Supabase.
  // Before that, return null so screens show the waiting state instead of
  // flashing the stale lote from a previous session.
  const loteActivo = estadoLoaded
    ? resolveLoteEnVivo(lotes, loteActivoId, resultados)
    : null;

  return {
    lotes, items, oferentes, resultados,
    loteActivoId, loteActivo, setLoteActivo,
    loading, syncing, lastSyncAt,
    estadoLoaded,
    error: errorMsg || null,
    refresh,
    refreshAfterDelete,
    refreshSilent,
  };
}
