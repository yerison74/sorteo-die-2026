import { Link } from 'react-router-dom';

export default function AccessDenied() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 24, textAlign: 'center',
    }}>
      {/* Background glow red */}
      <div style={{
        position: 'fixed', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(224,80,80,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 420 }}>
        {/* Icon */}
        <div style={{
          width: 80, height: 80, margin: '0 auto 24px',
          background: 'rgba(224,80,80,0.1)',
          border: '1px solid rgba(224,80,80,0.3)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36,
        }}>
          🔒
        </div>

        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 32, fontWeight: 700, color: 'var(--red)',
          marginBottom: 8,
        }}>
          Acceso Denegado
        </div>

        <div style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 12, color: 'var(--text-dim)',
          letterSpacing: '0.1em', marginBottom: 20,
        }}>
          ERROR 403 — UNAUTHORIZED
        </div>

        <div style={{
          fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: 32,
        }}>
          No tiene permiso para acceder a esta página.<br />
          Este panel está reservado para administradores del sorteo.
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <button className="btn btn-primary" style={{ padding: '11px 24px' }}>
              🔑 Iniciar Sesión
            </button>
          </Link>
          <Link to="/info" style={{ textDecoration: 'none' }}>
            <button className="btn btn-secondary" style={{ padding: '11px 24px' }}>
              📊 Ver Resultados Públicos
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
