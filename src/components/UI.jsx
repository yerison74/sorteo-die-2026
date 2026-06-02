// src/components/UI.jsx
// Shared primitive components used across the app

export function LoadingSpinner({ size = 20 }) {
  return (
    <div
      className="spin"
      style={{
        width: size,
        height: size,
        border: '2px solid var(--border2)',
        borderTopColor: 'var(--gold)',
        borderRadius: '50%',
        display: 'inline-block',
        flexShrink: 0,
      }}
    />
  );
}

export function Badge({ tipo }) {
  const t = (tipo || '').toUpperCase();
  return <span className={`badge badge-${t.toLowerCase()}`}>{t}</span>;
}

export function Alert({ type = 'info', children }) {
  return <div className={`alert alert-${type}`}>{children}</div>;
}

export function SectionHeader({ title, sub }) {
  return (
    <div className="section-header">
      <div className="section-title">{title}</div>
      {sub && <div className="section-sub">{sub}</div>}
    </div>
  );
}

export function EmptyState({ icon = '📋', text = 'Sin datos' }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <div className="empty-state-text">{text}</div>
    </div>
  );
}

export function GanadorCard({ posicion, resultado, onDelete }) {
  const colors = { 1: '#1a3668', 2: '#64748b', 3: '#b45309' };
  const icons  = { 1: '👑', 2: '🥈', 3: '🥉' };
  const labels = { 1: 'Ganador Principal', 2: 'Suplente 1', 3: 'Suplente 2' };
  const c = colors[posicion];

  return (
    <div
      className="ganador-card"
      style={{
        background: posicion === 1
          ? 'linear-gradient(135deg, var(--surface2), rgba(26,54,104,0.08))'
          : 'var(--surface2)',
        border: `1px solid ${c}40`,
        borderRadius: 'var(--radius)',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          background: c + '22', color: c,
          padding: '3px 8px', borderRadius: 4,
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
          alignSelf: 'flex-start',
        }}
      >
        {icons[posicion]} {labels[posicion]}
      </div>

      {resultado ? (
        <>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>
            {resultado.nombre_oferente}
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--text-dim)' }}>
            {resultado.codigo_oferente}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>RNC: {resultado.rnc}</span>
            {onDelete && (
              <button
                className="btn btn-danger btn-sm"
                onClick={() => onDelete(resultado.id)}
                title="Eliminar resultado"
              >
                ✕
              </button>
            )}
          </div>
        </>
      ) : (
        <div style={{ color: 'var(--text-dim)', fontSize: 12, marginTop: 4 }}>Sin registrar</div>
      )}
    </div>
  );
}
