import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: { params: { eventsPerSecond: 10 } },
});

export const db = {
  getLotes: () =>
    supabase.from('lotes').select('*').order('numero_lote', { ascending: true }),

  getAllItems: () =>
    supabase.from('items_lote').select('*').order('lote_id', { ascending: true }),

  getOferentes: () =>
    supabase.from('oferentes_sorteo').select('*').order('codigo', { ascending: true }),

  getOferenteByCode: (codigo) =>
    supabase.from('oferentes_sorteo').select('*').eq('codigo', codigo).limit(1).maybeSingle(),

  // Resultados WITHOUT foreign-table join to avoid RLS/naming issues
  getResultados: () =>
    supabase
      .from('resultados_sorteo')
      .select('*')
      .order('lote_id', { ascending: true })
      .order('posicion', { ascending: true }),

  insertResultado: (data) =>
    supabase.from('resultados_sorteo').insert(data).select().single(),

  deleteResultado: (id) =>
    supabase.from('resultados_sorteo').delete().eq('id', id),

  getSorteoEstado: () =>
    supabase.from('sorteo_estado').select('lote_activo_id').eq('id', 1).maybeSingle(),

  setLoteActivo: (loteId) =>
    supabase
      .from('sorteo_estado')
      .upsert({ id: 1, lote_activo_id: loteId ?? null, updated_at: new Date().toISOString() })
      .select()
      .single(),
};
