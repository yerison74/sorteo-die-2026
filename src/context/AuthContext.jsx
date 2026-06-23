import { createContext, useContext, useState, useCallback } from 'react';
import { compare } from 'bcrypt-ts';
import { authDb } from '../services/supabase';

const AuthContext = createContext(null);
const STORAGE_KEY      = 'sorteo_session';
const SORTEO_KEY       = 'sorteo_activo';

function loadSession() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (Date.now() < session.exp) return session;
    sessionStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
  return null;
}

function loadSorteoActivo() {
  try {
    const raw = sessionStorage.getItem(SORTEO_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

export function AuthProvider({ children }) {
  const [session,      setSession]      = useState(() => loadSession());
  const [sorteoActivo, setSorteoActivo] = useState(() => loadSorteoActivo());
  const [loginError,   setLoginError]   = useState('');

  const authenticated  = !!session;
  const sorteoSelected = !!sorteoActivo;           // true cuando ya eligió sorteo
  const currentUser    = session?.user || null;
  const isAdmin        = currentUser?.rol === 'admin';

  // ── Login ──────────────────────────────────────────────────────────────
  const login = useCallback(async (username, password) => {
    setLoginError('');
    try {
      const { data: usuario, error } = await authDb.getUserByUsername(username.trim());
      if (error) throw error;
      if (!usuario) { setLoginError('Usuario o contraseña incorrectos.'); return false; }

      const passwordOk = await compare(password, usuario.password_hash);
      if (!passwordOk) { setLoginError('Usuario o contraseña incorrectos.'); return false; }

      const newSession = {
        user: { id: usuario.id, username: usuario.username, nombre: usuario.nombre, rol: usuario.rol },
        exp: Date.now() + 8 * 60 * 60 * 1000,
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
      setSession(newSession);
      return true;
    } catch {
      setLoginError('Error de conexión. Intente de nuevo.');
      return false;
    }
  }, []);

  // ── Seleccionar sorteo (paso 2 del flujo de login) ────────────────────
  const selectSorteo = useCallback((sorteo) => {
    sessionStorage.setItem(SORTEO_KEY, JSON.stringify(sorteo));
    setSorteoActivo(sorteo);
  }, []);

  // ── Cambiar de sorteo sin cerrar sesión ───────────────────────────────
  const changeSorteo = useCallback(() => {
    sessionStorage.removeItem(SORTEO_KEY);
    try { localStorage.removeItem('sorteo-die-lote-activo-id'); } catch {}
    setSorteoActivo(null);
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(SORTEO_KEY);
    try { localStorage.removeItem('sorteo-die-lote-activo-id'); } catch {}
    setSession(null);
    setSorteoActivo(null);
    setLoginError('');
  }, []);

  return (
    <AuthContext.Provider value={{
      authenticated,
      sorteoSelected,
      sorteoActivo,
      currentUser,
      isAdmin,
      login,
      logout,
      selectSorteo,
      changeSorteo,
      loginError,
      setLoginError,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
