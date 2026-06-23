import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, loginError, setLoginError } = useAuth();
  const [user, setUser]     = useState('');
  const [pass, setPass]     = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user.trim() || !pass) return;
    setLoading(true);
    // Small artificial delay to prevent brute-force feel
    await new Promise(r => setTimeout(r, 500));
    login(user.trim(), pass);
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: '20%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 420, position: 'relative', zIndex: 1,
      }}>
        {/* Logo / header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <img
            src="/logoDie.png"
            alt="Educación - Infraestructura Escolar"
            style={{
              width: 120, height: 'auto',
              margin: '0 auto 16px',
              display: 'block',
            }}
          />
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 26, fontWeight: 700, color: 'var(--gold2)',
            marginBottom: 6,
          }}>
            Sistema de Sorteo
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            DIE — Infraestructura Escolar · 2026
          </div>
        </div>

        {/* Login form */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid rgba(201,168,76,0.2)',
          borderRadius: 16, padding: 32,
          boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>
            Acceso al Panel Administrativo
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 24 }}>
            Ingrese sus credenciales para continuar
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* User */}
            <div className="form-group">
              <label className="form-label">Usuario</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 16, opacity: 0.5,
                }}>👤</span>
                <input
                  className="form-input"
                  style={{ paddingLeft: 38, fontFamily: "'Outfit',sans-serif", fontSize: 14 }}
                  type="text"
                  placeholder="Nombre de usuario"
                  value={user}
                  autoComplete="username"
                  autoFocus
                  onChange={e => { setUser(e.target.value); setLoginError(''); }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 16, opacity: 0.5,
                }}>🔒</span>
                <input
                  className="form-input"
                  style={{ paddingLeft: 38, paddingRight: 44, fontFamily: "'Outfit',sans-serif", fontSize: 14 }}
                  type={showPass ? 'text' : 'password'}
                  placeholder="Contraseña"
                  value={pass}
                  autoComplete="current-password"
                  onChange={e => { setPass(e.target.value); setLoginError(''); }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 16, opacity: 0.5, padding: 4,
                    color: 'var(--text)',
                  }}
                  title={showPass ? 'Ocultar' : 'Mostrar'}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Error */}
            {loginError && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(224,80,80,0.1)', border: '1px solid rgba(224,80,80,0.28)',
                borderRadius: 8, padding: '10px 14px',
                fontSize: 13, color: 'var(--red)', fontWeight: 500,
                animation: 'slideIn 0.3s ease',
              }}>
                ⚠️ {loginError}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!user.trim() || !pass || loading}
              style={{ width: '100%', padding: '13px', fontSize: 15, marginTop: 4 }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                  <span className="spin" style={{ width: 18, height: 18, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%', display: 'inline-block' }} />
                  Verificando…
                </span>
              ) : (
                'Iniciar Sesión →'
              )}
            </button>
          </form>
        </div>

        {/* Public info note */}
        <div style={{
          marginTop: 20, textAlign: 'center',
          fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6,
        }}>
          ¿Asistente al sorteo?{' '}
          <a href="/info" style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 600 }}>
            Ver resultados públicos →
          </a>
        </div>
      </div>
    </div>
  );
}
