import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { sorteosDb } from '../services/supabase';

/* ── Helpers ──────────────────────────────────────────────────────────── */
function formatDate(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ── Componente de tarjeta de sorteo ──────────────────────────────────── */
function SorteoCard({ sorteo, onSelect, onDelete }) {
  const isHistorico = sorteo.id === 1;
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: `1px solid ${isHistorico ? 'rgba(201,168,76,0.35)' : 'var(--border)'}`,
        borderRadius: 12,
        padding: '18px 22px',
        display: 'flex', alignItems: 'center', gap: 16,
        transition: 'all 0.18s',
        boxShadow: 'var(--shadow-card)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Icono */}
      <div
        onClick={() => onSelect(sorteo)}
        style={{
          width: 48, height: 48, borderRadius: 12, flexShrink: 0,
          background: isHistorico
            ? 'linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05))'
            : 'linear-gradient(135deg, rgba(26,54,104,0.15), rgba(26,54,104,0.05))',
          border: `1px solid ${isHistorico ? 'rgba(201,168,76,0.3)' : 'rgba(26,54,104,0.2)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, cursor: 'pointer',
        }}
      >
        {isHistorico ? '🏛️' : '🎯'}
      </div>

      {/* Info — clic para entrar */}
      <div
        onClick={() => onSelect(sorteo)}
        style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>
            {sorteo.nombre}
          </span>
          {isHistorico && (
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
              background: 'rgba(201,168,76,0.15)', color: 'var(--gold)',
              border: '1px solid rgba(201,168,76,0.3)',
              padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase',
            }}>
              Completado
            </span>
          )}
          {!isHistorico && sorteo.activo && (
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
              background: 'rgba(34,197,94,0.12)', color: '#16a34a',
              border: '1px solid rgba(34,197,94,0.3)',
              padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase',
            }}>
              Activo
            </span>
          )}
        </div>
        {sorteo.descripcion && (
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {sorteo.descripcion}
          </div>
        )}
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
          Creado: {formatDate(sorteo.created_at)}
        </div>
      </div>

      {/* Acciones derechas */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {/* Botón eliminar — solo para sorteos no históricos */}
        {!isHistorico && (
          <button
            onClick={e => { e.stopPropagation(); onDelete(sorteo); }}
            title="Eliminar sorteo"
            style={{
              width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(224,80,80,0.25)',
              background: 'rgba(224,80,80,0.06)', color: 'var(--red)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(224,80,80,0.15)'; e.currentTarget.style.borderColor = 'rgba(224,80,80,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(224,80,80,0.06)'; e.currentTarget.style.borderColor = 'rgba(224,80,80,0.25)'; }}
          >
            🗑️
          </button>
        )}
        <span
          onClick={() => onSelect(sorteo)}
          style={{ color: 'var(--text-dim)', fontSize: 18, cursor: 'pointer', paddingLeft: 4 }}
        >›</span>
      </div>
    </div>
  );
}

/* ── Modal: Confirmar eliminación ─────────────────────────────────────── */
function ConfirmDeleteModal({ sorteo, onClose, onConfirm, deleting, error }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1100,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'var(--surface)',
        border: '1px solid rgba(224,80,80,0.3)',
        borderRadius: 16, padding: 32, maxWidth: 420, width: '100%',
        boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
      }}>
        {/* Icono de advertencia */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', margin: '0 auto 14px',
            background: 'rgba(224,80,80,0.1)', border: '2px solid rgba(224,80,80,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
          }}>
            ⚠️
          </div>
          <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--text)', marginBottom: 6 }}>
            Eliminar Sorteo
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6 }}>
            ¿Está seguro que desea eliminar el sorteo
          </div>
          <div style={{
            fontFamily: "'DM Mono',monospace", fontSize: 16, fontWeight: 700,
            color: 'var(--red)', margin: '8px 0',
          }}>
            {sorteo.nombre}
          </div>
          <div style={{
            fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6,
            background: 'rgba(224,80,80,0.06)', border: '1px solid rgba(224,80,80,0.15)',
            borderRadius: 8, padding: '10px 14px', marginTop: 8,
          }}>
            ⚠️ Se eliminarán también todos los lotes, oferentes, ítems y resultados asociados a este sorteo. Esta acción no se puede deshacer.
          </div>
        </div>

        {error && (
          <div style={{
            background: 'rgba(224,80,80,0.08)', border: '1px solid rgba(224,80,80,0.25)',
            borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--red)',
            marginBottom: 16,
          }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            disabled={deleting}
            style={{
              flex: 1, padding: '11px', borderRadius: 8, cursor: 'pointer',
              border: '1px solid var(--border)', background: 'var(--surface2)',
              color: 'var(--text)', fontSize: 14, fontWeight: 600,
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            style={{
              flex: 1, padding: '11px', borderRadius: 8, cursor: deleting ? 'not-allowed' : 'pointer',
              border: '1px solid rgba(224,80,80,0.4)', background: 'rgba(224,80,80,0.9)',
              color: '#fff', fontSize: 14, fontWeight: 600,
              opacity: deleting ? 0.7 : 1,
            }}
          >
            {deleting ? 'Eliminando…' : '🗑️ Sí, eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Modal: Crear nuevo sorteo ────────────────────────────────────────── */
function NuevoSorteoModal({ onClose, onCreate }) {
  const [nombre,      setNombre]      = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [nombreAuto,  setNombreAuto]  = useState('');
  const [loadingAuto, setLoadingAuto] = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');
  const [modoNombre,  setModoNombre]  = useState('auto'); // 'auto' | 'manual'

  // Cargar siguiente nombre automático
  useEffect(() => {
    sorteosDb.getSiguienteNombre().then(({ data, error }) => {
      if (!error && data) setNombreAuto(data);
      setLoadingAuto(false);
    });
  }, []);

  const nombreFinal = modoNombre === 'auto' ? nombreAuto : nombre.trim();

  const handleCreate = async () => {
    if (!nombreFinal) { setError('El nombre es obligatorio.'); return; }
    setSaving(true);
    setError('');
    const { data, error: err } = await sorteosDb.createSorteo(nombreFinal, descripcion.trim());
    setSaving(false);
    if (err) {
      setError(err.message?.includes('unique') ? 'Ya existe un sorteo con ese nombre.' : err.message);
      return;
    }
    onCreate(data);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'var(--surface)',
        border: '1px solid rgba(201,168,76,0.25)',
        borderRadius: 16, padding: 32, maxWidth: 480, width: '100%',
        boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <span style={{ fontSize: 28 }}>🆕</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--text)' }}>Nuevo Sorteo</div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Configure el nombre y descripción</div>
          </div>
        </div>

        {/* Selector de modo nombre */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            Nombre del Sorteo
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {[
              { key: 'auto',   label: '✨ Automático', sub: nombreAuto || '…' },
              { key: 'manual', label: '✏️ Personalizado', sub: 'Escribe el nombre' },
            ].map(opt => (
              <button
                key={opt.key}
                onClick={() => setModoNombre(opt.key)}
                style={{
                  flex: 1, padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                  border: `1.5px solid ${modoNombre === opt.key ? 'var(--accent)' : 'var(--border)'}`,
                  background: modoNombre === opt.key ? 'rgba(26,54,104,0.1)' : 'var(--surface2)',
                  color: modoNombre === opt.key ? 'var(--accent)' : 'var(--text)',
                  textAlign: 'left', transition: 'all 0.15s',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 13 }}>{opt.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{opt.sub}</div>
              </button>
            ))}
          </div>

          {modoNombre === 'auto' ? (
            <div style={{
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              {loadingAuto ? (
                <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>Calculando nombre…</span>
              ) : (
                <>
                  <span style={{ fontSize: 20 }}>🏷️</span>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 15, fontWeight: 700, color: 'var(--gold2)' }}>
                    {nombreAuto}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 4 }}>
                    (generado automáticamente)
                  </span>
                </>
              )}
            </div>
          ) : (
            <input
              className="form-input"
              placeholder="Ej: DIE-2026-S02  o  Sorteo Especial Sur"
              value={nombre}
              onChange={e => { setNombre(e.target.value); setError(''); }}
              autoFocus
              style={{ width: '100%', boxSizing: 'border-box', fontFamily: "'DM Mono',monospace" }}
            />
          )}
        </div>

        {/* Descripción */}
        <div className="form-group" style={{ marginBottom: 20 }}>
          <label className="form-label">Descripción (opcional)</label>
          <input
            className="form-input"
            placeholder="Ej: Licitación pública región Norte"
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(224,80,80,0.08)', border: '1px solid rgba(224,80,80,0.25)',
            borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--red)',
            marginBottom: 18,
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Acciones */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px', borderRadius: 8, cursor: 'pointer',
              border: '1px solid var(--border)', background: 'var(--surface2)',
              color: 'var(--text)', fontSize: 14,
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={saving || !nombreFinal}
            className="btn btn-primary"
            style={{ padding: '10px 24px', fontSize: 14 }}
          >
            {saving ? 'Creando…' : '🚀 Crear Sorteo'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Página principal ─────────────────────────────────────────────────── */
export default function SorteoSelectorPage() {
  const { currentUser, selectSorteo, logout } = useAuth();
  const [sorteos,      setSorteos]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showModal,    setShowModal]    = useState(false);
  const [fetchError,   setFetchError]   = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);  // sorteo a eliminar
  const [deleting,     setDeleting]     = useState(false);
  const [deleteError,  setDeleteError]  = useState('');

  const cargarSorteos = useCallback(async () => {
    setLoading(true);
    const { data, error } = await sorteosDb.getSorteos();
    setLoading(false);
    if (error) { setFetchError('Error al cargar sorteos: ' + error.message); return; }
    setSorteos(data || []);
  }, []);

  useEffect(() => { cargarSorteos(); }, [cargarSorteos]);

  const handleSorteoCreado = (nuevoSorteo) => {
    setShowModal(false);
    selectSorteo(nuevoSorteo); // entra directo al nuevo sorteo
  };

  const handleDeleteRequest = (sorteo) => {
    setDeleteError('');
    setDeleteTarget(sorteo);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    const { error } = await sorteosDb.deleteSorteo(deleteTarget.id);
    setDeleting(false);
    if (error) {
      setDeleteError(error.message || 'No se pudo eliminar el sorteo.');
      return;
    }
    setDeleteTarget(null);
    cargarSorteos();
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: '25%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 700, height: 700, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(26,54,104,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 520, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/logoDie.png" alt="DIE" style={{ width: 90, height: 'auto', margin: '0 auto 14px', display: 'block' }} />
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: 'var(--gold2)', marginBottom: 4 }}>
            Sistema de Sorteo DIE
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Bienvenido, {currentUser?.nombre || currentUser?.username}
          </div>
        </div>

        {/* Card principal */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid rgba(201,168,76,0.2)',
          borderRadius: 16, padding: 28,
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
              Seleccione un Sorteo
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
              Elija el sorteo al que desea acceder o cree uno nuevo
            </div>
          </div>

          {/* Lista de sorteos */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-dim)', fontSize: 13 }}>
              <div className="spin" style={{ width: 28, height: 28, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', display: 'inline-block', marginBottom: 10 }} />
              <div>Cargando sorteos…</div>
            </div>
          ) : fetchError ? (
            <div style={{ background: 'rgba(224,80,80,0.08)', border: '1px solid rgba(224,80,80,0.2)', borderRadius: 8, padding: 14, color: 'var(--red)', fontSize: 13 }}>
              {fetchError}
              <button onClick={cargarSorteos} style={{ marginLeft: 12, fontSize: 12, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                Reintentar
              </button>
            </div>
          ) : sorteos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text-dim)', fontSize: 13 }}>
              No hay sorteos registrados aún.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {sorteos.map(s => (
                <SorteoCard key={s.id} sorteo={s} onSelect={selectSorteo} onDelete={handleDeleteRequest} />
              ))}
            </div>
          )}

          {/* Separador */}
          <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />

          {/* Botón crear nuevo */}
          <button
            onClick={() => setShowModal(true)}
            style={{
              width: '100%', padding: '12px', borderRadius: 10, cursor: 'pointer',
              border: '1.5px dashed rgba(201,168,76,0.4)',
              background: 'rgba(201,168,76,0.04)',
              color: 'var(--gold2)', fontWeight: 600, fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,168,76,0.1)'; e.currentTarget.style.borderColor = 'rgba(201,168,76,0.7)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(201,168,76,0.04)'; e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)'; }}
          >
            <span style={{ fontSize: 18 }}>＋</span>
            Crear Nuevo Sorteo
          </button>
        </div>

        {/* Cerrar sesión */}
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button
            onClick={logout}
            style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Modal nuevo sorteo */}
      {showModal && (
        <NuevoSorteoModal
          onClose={() => setShowModal(false)}
          onCreate={handleSorteoCreado}
        />
      )}

      {/* Modal confirmar eliminación */}
      {deleteTarget && (
        <ConfirmDeleteModal
          sorteo={deleteTarget}
          onClose={() => { setDeleteTarget(null); setDeleteError(''); }}
          onConfirm={handleDeleteConfirm}
          deleting={deleting}
          error={deleteError}
        />
      )}
    </div>
  );
}
