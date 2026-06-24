import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: { params: { eventsPerSecond: 10 } },
});

// ── Sorteos (multi-sorteo) ────────────────────────────────────────────────
export const sorteosDb = {
  // Lista todos los sorteos ordenados por id
  getSorteos: () =>
    supabase.from('sorteos').select('*').order('id', { ascending: true }),

  // Obtiene un solo sorteo por id (usado en /info público, sin sesión)
  getSorteoById: (id) =>
    supabase.from('sorteos').select('*').eq('id', id).maybeSingle(),

  // Crea un sorteo nuevo; devuelve la fila creada
  createSorteo: (nombre, descripcion = '') =>
    supabase
      .from('sorteos')
      .insert({ nombre: nombre.trim(), descripcion, activo: true })
      .select()
      .single(),

  // Llama la función SQL que genera el siguiente nombre DIE-2026-S##
  getSiguienteNombre: () =>
    supabase.rpc('siguiente_nombre_sorteo'),

  // Elimina un sorteo (el trigger de BD impide borrar id=1)
  deleteSorteo: (id) =>
    supabase.from('sorteos').delete().eq('id', id),
};

export const db = {
  // Todas las queries ahora reciben sorteo_id para filtrar
  getLotes: (sorteoId) =>
    supabase
      .from('lotes')
      .select('*')
      .eq('sorteo_id', sorteoId)
      .order('numero_lote', { ascending: true }),

  getAllItems: (sorteoId) =>
    supabase
      .from('items_lote')
      .select('*')
      .eq('sorteo_id', sorteoId)
      .order('lote_id', { ascending: true }),

  getOferentes: (sorteoId) =>
    supabase
      .from('oferentes_sorteo')
      .select('*')
      .eq('sorteo_id', sorteoId)
      .order('codigo', { ascending: true }),

  getOferenteByCode: (codigo, sorteoId) =>
    supabase
      .from('oferentes_sorteo')
      .select('*')
      .eq('codigo', codigo)
      .eq('sorteo_id', sorteoId)
      .limit(1)
      .maybeSingle(),

  getResultados: (sorteoId) =>
    supabase
      .from('resultados_sorteo')
      .select('*')
      .eq('sorteo_id', sorteoId)
      .order('lote_id', { ascending: true })
      .order('posicion', { ascending: true }),

  insertResultado: (data) =>
    supabase.from('resultados_sorteo').insert(data).select().single(),

  deleteResultado: (id) =>
    supabase.from('resultados_sorteo').delete().eq('id', id),

  getSorteoEstado: (sorteoId) =>
    supabase.from('sorteo_estado').select('lote_actual_id').eq('sorteo_activo_id', sorteoId).maybeSingle(),

  setLoteActivo: (loteId, sorteoId) =>
    supabase
      .from('sorteo_estado')
      .upsert(
        { sorteo_activo_id: sorteoId, lote_actual_id: loteId ?? null, actualizado: new Date().toISOString() },
        { onConflict: 'sorteo_activo_id' }
      )
      .select()
      .single(),
};

// ── User management ───────────────────────────────────────────────────────
export const authDb = {
  getUserByUsername: (username) =>
    supabase
      .from('usuarios_sorteo')
      .select('*')
      .eq('username', username)
      .eq('activo', true)
      .maybeSingle(),

  getUsuarios: () =>
    supabase
      .from('usuarios_sorteo')
      .select('id, username, nombre, rol, activo, created_at, updated_at')
      .order('created_at', { ascending: true }),

  createUsuario: (data) =>
    supabase
      .from('usuarios_sorteo')
      .insert(data)
      .select('id, username, nombre, rol, activo, created_at')
      .single(),

  updateUsuario: (id, data) =>
    supabase
      .from('usuarios_sorteo')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, username, nombre, rol, activo, updated_at')
      .single(),

  changePassword: (id, newHash) =>
    supabase
      .from('usuarios_sorteo')
      .update({ password_hash: newHash, updated_at: new Date().toISOString() })
      .eq('id', id),

  deleteUsuario: (id) =>
    supabase
      .from('usuarios_sorteo')
      .update({ activo: false, updated_at: new Date().toISOString() })
      .eq('id', id),

  hardDeleteUsuario: (id) =>
    supabase.from('usuarios_sorteo').delete().eq('id', id),
};
