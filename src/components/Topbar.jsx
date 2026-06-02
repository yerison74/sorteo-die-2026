import { NavLink } from 'react-router-dom';
import { LoadingSpinner } from './UI';
import SyncStatus from './SyncStatus';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { path: '/',             label: 'Dashboard',       icon: '📊' },
  { path: '/operador',     label: 'Panel Operador',   icon: '🎲' },
  { path: '/publico',      label: 'Pantalla Pública', icon: '📺' },
  { path: '/ganadores',    label: 'Ganadores',        icon: '🏆' },
  { path: '/configuracion',label: 'Configuración',    icon: '⚙️', adminOnly: false },
];

export default function Topbar({ onRefresh, loading, lastSyncAt }) {
  const { logout, currentUser } = useAuth();

  return (
    <header className="topbar">
      <div className="topbar-logo">
        <img src="/logoDie.png" alt="Educación - Infraestructura Escolar" className="topbar-logo-img" />
        <div>
          <div className="topbar-title">Sistema de Sorteo</div>
          <div className="topbar-sub">DIE — Infraestructura Escolar · 2026</div>
        </div>
      </div>

      <nav className="topbar-nav">
        {NAV.map(n => (
          <NavLink
            key={n.path}
            to={n.path}
            end={n.path === '/'}
            className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`}
          >
            <span>{n.icon}</span> {n.label}
          </NavLink>
        ))}
      </nav>

      <div className="topbar-actions">
        {/* Logged user */}
        {currentUser && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '5px 12px', fontSize: 12,
          }}>
            <span style={{ opacity: 0.6 }}>{currentUser.rol === 'admin' ? '👑' : '🎲'}</span>
            <span style={{ fontWeight: 600, color: 'var(--text)' }}>{currentUser.nombre}</span>
          </div>
        )}
        {lastSyncAt && <SyncStatus lastSyncAt={lastSyncAt} syncing={loading} compact />}
        {loading && <LoadingSpinner size={18} />}
        <button className="btn btn-secondary btn-sm" onClick={onRefresh} title="Actualizar datos">
          ⟳ Actualizar
        </button>
        <button
          className="btn btn-sm"
          onClick={logout}
          title="Cerrar sesión"
          style={{
            background: 'rgba(224,80,80,0.08)',
            border: '1px solid rgba(224,80,80,0.22)',
            color: 'var(--red)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          🚪 Salir
        </button>
      </div>
    </header>
  );
}
