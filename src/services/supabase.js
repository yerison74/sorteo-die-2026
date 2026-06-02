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

// ── User management ───────────────────────────────────────────────────────
export const authDb = {
  // Find user by username for login
  getUserByUsername: (username) =>
    supabase
      .from('usuarios_sorteo')
      .select('*')
      .eq('username', username)
      .eq('activo', true)
      .maybeSingle(),

  // List all users (for settings page — no password_hash)
  getUsuarios: () =>
    supabase
      .from('usuarios_sorteo')
      .select('id, username, nombre, rol, activo, created_at, updated_at')
      .order('created_at', { ascending: true }),

  // Create user (password_hash already computed by caller)
  createUsuario: (data) =>
    supabase
      .from('usuarios_sorteo')
      .insert(data)
      .select('id, username, nombre, rol, activo, created_at')
      .single(),

  // Update user (without touching password_hash)
  updateUsuario: (id, data) =>
    supabase
      .from('usuarios_sorteo')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, username, nombre, rol, activo, updated_at')
      .single(),

  // Change password for a user
  changePassword: (id, newHash) =>
    supabase
      .from('usuarios_sorteo')
      .update({ password_hash: newHash, updated_at: new Date().toISOString() })
      .eq('id', id),

  // Soft-delete: deactivate
  deleteUsuario: (id) =>
    supabase
      .from('usuarios_sorteo')
      .update({ activo: false, updated_at: new Date().toISOString() })
      .eq('id', id),

  // Permanent delete
  hardDeleteUsuario: (id) =>
    supabase.from('usuarios_sorteo').delete().eq('id', id),
};
