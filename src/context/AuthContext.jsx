import { createContext, useContext, useState, useCallback } from 'react';
import { compare, hash } from 'bcrypt-ts';
import { authDb } from '../services/supabase';

const AuthContext = createContext(null);
const STORAGE_KEY = 'sorteo_session';

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

export function AuthProvider({ children }) {
  const [session, setSession]       = useState(() => loadSession());
  const [loginError, setLoginError] = useState('');

  const authenticated = !!session;
  const currentUser   = session?.user || null;   // { id, username, nombre, rol }
  const isAdmin       = currentUser?.rol === 'admin';

  // ── Login ──────────────────────────────────────────────────────────────
  const login = useCallback(async (username, password) => {
    setLoginError('');
    try {
      const { data: usuario, error } = await authDb.getUserByUsername(username.trim());

      if (error) throw error;

      if (!usuario) {
        setLoginError('Usuario o contraseña incorrectos.');
        return false;
      }

      const passwordOk = await compare(password, usuario.password_hash);
      if (!passwordOk) {
        setLoginError('Usuario o contraseña incorrectos.');
        return false;
      }

      const newSession = {
        user: {
          id:       usuario.id,
          username: usuario.username,
          nombre:   usuario.nombre,
          rol:      usuario.rol,
        },
        exp: Date.now() + 8 * 60 * 60 * 1000, // 8 horas
      };

      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
      setSession(newSession);
      return true;

    } catch (e) {
      setLoginError('Error de conexión. Intente de nuevo.');
      return false;
    }
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    // Also clear lote activo cache so next session starts clean
    try { localStorage.removeItem('sorteo-die-lote-activo-id'); } catch {}
    setSession(null);
    setLoginError('');
  }, []);

  return (
    <AuthContext.Provider value={{
      authenticated,
      currentUser,
      isAdmin,
      login,
      logout,
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
