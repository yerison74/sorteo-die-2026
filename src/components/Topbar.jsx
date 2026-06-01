import { NavLink } from 'react-router-dom';
import { LoadingSpinner } from './UI';

const NAV = [
  { path: '/',           label: 'Dashboard',       icon: '📊' },
  { path: '/operador',   label: 'Panel Operador',   icon: '🎲' },
  { path: '/publico',    label: 'Pantalla Pública', icon: '📺' },
  { path: '/ganadores',  label: 'Ganadores',        icon: '🏆' },
];

export default function Topbar({ onRefresh, loading }) {
  return (
    <header className="topbar">
      <div className="topbar-logo">
        <div className="topbar-emblem">⚖️</div>
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
        {loading && <LoadingSpinner size={18} />}
        <button className="btn btn-secondary btn-sm" onClick={onRefresh} title="Actualizar datos">
          ⟳ Actualizar
        </button>
      </div>
    </header>
  );
}
