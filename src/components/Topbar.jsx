import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LoadingSpinner } from './UI';
import SyncStatus from './SyncStatus';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { path: '/',              label: 'Dashboard',       icon: '📊' },
  { path: '/operador',      label: 'Panel Operador',   icon: '🎲' },
  { path: '/publico',       label: 'Pantalla Pública', icon: '📺' },
  { path: '/ganadores',     label: 'Ganadores',        icon: '🏆' },
  { path: '/importar',      label: 'Importar',         icon: '📥' },
  { path: '/configuracion', label: 'Configuración',    icon: '⚙️' },
];

export default function Topbar({ onRefresh, loading, lastSyncAt }) {
  const { logout, currentUser, sorteoActivo, changeSorteo } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => { setMenuOpen(false); logout(); };
  const handleChangeSorteo = () => { setMenuOpen(false); changeSorteo(); };

  return (
    <>
      <header style={{
        background: 'rgba(255,255,255,0.96)',
        borderBottom: '1px solid rgba(15,23,42,0.06)',
        padding: '0 16px',
        height: 58,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
        backdropFilter: 'blur(16px)',
        boxShadow: '0 1px 12px rgba(0,0,0,0.06)',
        gap: 8,
      }}>

        {/* ── Logo ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <img src="/logoDie.png" alt="DIE" style={{ height: 38, width: 'auto', objectFit: 'contain' }} />
          <div className="topbar-logo-text">
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 700, color: 'var(--brand-navy)', lineHeight: 1.1 }}>
              Sistema de Sorteo
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              DIE · 2026
            </div>
          </div>
        </div>

        {/* ── Nav escritorio ── */}
        <nav className="topbar-nav-desktop">
          {NAV.map(n => (
            <NavLink
              key={n.path}
              to={n.path}
              end={n.path === '/'}
              className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`}
              style={{ fontSize: 12, padding: '6px 10px', gap: 4 }}
            >
              <span style={{ fontSize: 13 }}>{n.icon}</span>
              <span className="nav-label">{n.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* ── Acciones escritorio ── */}
        <div className="topbar-actions-desktop">
          {/* Sorteo activo */}
          {sorteoActivo && (
            <button onClick={changeSorteo} title="Cambiar de sorteo" style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.3)',
              borderRadius: 7, padding: '4px 10px', fontSize: 11, cursor: 'pointer',
              color: 'var(--gold2)', fontWeight: 700, whiteSpace: 'nowrap',
            }}>
              <span>🏷️</span>
              <span style={{ fontFamily: "'DM Mono',monospace" }}>{sorteoActivo.nombre}</span>
              <span style={{ opacity: 0.5, fontSize: 9 }}>▼</span>
            </button>
          )}

          {/* Usuario */}
          {currentUser && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 7, padding: '4px 10px', fontSize: 11, whiteSpace: 'nowrap',
            }}>
              <span style={{ opacity: 0.6 }}>{currentUser.rol === 'admin' ? '👑' : '🎲'}</span>
              <span style={{ fontWeight: 600 }}>{currentUser.nombre}</span>
            </div>
          )}

          {lastSyncAt && <SyncStatus lastSyncAt={lastSyncAt} syncing={loading} compact />}
          {loading && <LoadingSpinner size={16} />}

          <button className="btn btn-secondary btn-sm" onClick={onRefresh} title="Actualizar"
            style={{ fontSize: 12, padding: '5px 10px' }}>
            ⟳
          </button>
          <button onClick={logout} title="Cerrar sesión" style={{
            padding: '5px 10px', borderRadius: 7, fontSize: 12, cursor: 'pointer',
            background: 'rgba(224,80,80,0.08)', border: '1px solid rgba(224,80,80,0.22)',
            color: 'var(--red)', fontWeight: 600,
          }}>
            🚪
          </button>
        </div>

        {/* ── Botón hamburguesa (móvil / tablets) ── */}
        <div className="topbar-mobile-right">
          {sorteoActivo && (
            <span style={{
              fontFamily: "'DM Mono',monospace", fontSize: 11, fontWeight: 700,
              color: 'var(--gold2)', background: 'rgba(201,168,76,0.1)',
              border: '1px solid rgba(201,168,76,0.25)', borderRadius: 6,
              padding: '3px 8px', whiteSpace: 'nowrap',
            }}>
              {sorteoActivo.nombre}
            </span>
          )}
          {loading && <LoadingSpinner size={16} />}
          <button
            onClick={() => setMenuOpen(o => !o)}
            style={{
              width: 38, height: 38, borderRadius: 8, cursor: 'pointer',
              border: '1px solid var(--border)', background: menuOpen ? 'var(--surface2)' : 'transparent',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
            }}
          >
            <span style={{ display: 'block', width: 18, height: 2, background: 'var(--text)', borderRadius: 2, transition: 'all 0.2s', transform: menuOpen ? 'rotate(45deg) translate(3px, 3px)' : 'none' }} />
            <span style={{ display: 'block', width: 18, height: 2, background: 'var(--text)', borderRadius: 2, transition: 'all 0.2s', opacity: menuOpen ? 0 : 1 }} />
            <span style={{ display: 'block', width: 18, height: 2, background: 'var(--text)', borderRadius: 2, transition: 'all 0.2s', transform: menuOpen ? 'rotate(-45deg) translate(3px, -3px)' : 'none' }} />
          </button>
        </div>
      </header>

      {/* ── Menú desplegable móvil ── */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: 58, left: 0, right: 0, zIndex: 99,
          background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          padding: '12px 16px 16px',
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          {/* Nav links */}
          {NAV.map(n => (
            <NavLink
              key={n.path}
              to={n.path}
              end={n.path === '/'}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`}
              style={{ fontSize: 14, padding: '10px 14px', justifyContent: 'flex-start' }}
            >
              <span style={{ fontSize: 16, width: 24, textAlign: 'center' }}>{n.icon}</span>
              {n.label}
            </NavLink>
          ))}

          {/* Separador */}
          <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />

          {/* Info usuario */}
          {currentUser && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 14px', borderRadius: 8,
              background: 'var(--surface2)', border: '1px solid var(--border)',
              fontSize: 13,
            }}>
              <span>{currentUser.rol === 'admin' ? '👑' : '🎲'}</span>
              <div>
                <div style={{ fontWeight: 600 }}>{currentUser.nombre}</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'capitalize' }}>{currentUser.rol}</div>
              </div>
              {lastSyncAt && <div style={{ marginLeft: 'auto' }}><SyncStatus lastSyncAt={lastSyncAt} syncing={loading} compact /></div>}
            </div>
          )}

          {/* Acciones */}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            {sorteoActivo && (
              <button onClick={handleChangeSorteo} style={{
                flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer',
                border: '1px solid rgba(201,168,76,0.3)', background: 'rgba(201,168,76,0.06)',
                color: 'var(--gold2)', fontWeight: 600, fontSize: 13,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                🏷️ Cambiar sorteo
              </button>
            )}
            <button onClick={onRefresh} style={{
              padding: '10px 16px', borderRadius: 8, cursor: 'pointer',
              border: '1px solid var(--border)', background: 'var(--surface2)',
              color: 'var(--text)', fontWeight: 600, fontSize: 13,
            }}>
              ⟳ Actualizar
            </button>
            <button onClick={handleLogout} style={{
              padding: '10px 16px', borderRadius: 8, cursor: 'pointer',
              border: '1px solid rgba(224,80,80,0.3)', background: 'rgba(224,80,80,0.06)',
              color: 'var(--red)', fontWeight: 600, fontSize: 13,
            }}>
              🚪 Salir
            </button>
          </div>
        </div>
      )}

      {/* Overlay para cerrar menú al tocar fuera */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 98, top: 58 }}
        />
      )}
    </>
  );
}
