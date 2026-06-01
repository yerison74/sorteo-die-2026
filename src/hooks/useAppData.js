import { useState, useEffect, useCallback } from 'react';
import { supabase, db } from '../services/supabase';

export function useAppData() {
  const [lotes, setLotes] = useState([]);
  const [items, setItems] = useState([]);
  const [oferentes, setOferentes] = useState([]);
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});

  const loadAll = useCallback(async () => {
    setLoading(true);
    const newErrors = {};

    // Load each table independently so one failure doesn't block the rest
    const { data: l, error: e1 } = await db.getLotes();
    if (e1) newErrors.lotes = e1.message;
    else setLotes(l || []);

    const { data: it, error: e2 } = await db.getAllItems();
    if (e2) newErrors.items = e2.message;
    else setItems(it || []);

    const { data: of, error: e3 } = await db.getOferentes();
    if (e3) newErrors.oferentes = e3.message;
    else setOferentes(of || []);

    const { data: r, error: e4 } = await db.getResultados();
    if (e4) newErrors.resultados = e4.message;
    else setResultados(r || []);

    setErrors(newErrors);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('resultados-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resultados_sorteo' }, () => loadAll())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [loadAll]);

  const errorMsg = Object.entries(errors)
    .map(([t, m]) => `[${t}]: ${m}`)
    .join(' | ');

  return { lotes, items, oferentes, resultados, loading, error: errorMsg || null, refresh: loadAll };
}
