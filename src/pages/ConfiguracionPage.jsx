import { useState, useEffect, useCallback } from 'react';
import { hash, compare } from 'bcrypt-ts';
import { authDb } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner, Alert } from '../components/UI';

// ── helpers ───────────────────────────────────────────────────────────────
const ROL_LABELS = { admin: '👑 Admin', operador: '🎲 Operador' };
const ROL_COLORS = {
  admin:    { bg: 'rgba(201,168,76,0.12)',   color: 'var(--gold2)',  border: 'rgba(201,168,76,0.3)' },
  operador: { bg: 'rgba(61,127,255,0.10)',   color: 'var(--accent2)', border: 'rgba(61,127,255,0.3)' },
};

function RolBadge({ rol }) {
  const s = ROL_COLORS[rol] || ROL_COLORS.operador;
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      padding: '2px 10px', borderRadius: 100,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
    }}>
      {ROL_LABELS[rol] || rol}
    </span>
  );
}

function PasswordInput({ value, onChange, placeholder = 'Contraseña', autoComplete = 'new-password' }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input
        className="form-input"
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        style={{ paddingRight: 40, fontFamily: "'Outfit',sans-serif", fontSize: 14 }}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        style={{
          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 15, opacity: 0.5, color: 'var(--text)', padding: 4,
        }}
      >{show ? '🙈' : '👁️'}</button>
    </div>
  );
}

// ── Modal wrapper ─────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: 'var(--surface)', border: '1px solid rgba(201,168,76,0.2)',
        borderRadius: 16, padding: 28, width: '100%', maxWidth: 480,
        boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
        animation: 'slideIn 0.25s ease',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{title}</div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-dim)', lineHeight: 1 }}
          >×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Create / Edit User Modal ──────────────────────────────────────────────
function UserModal({ editing, onClose, onSaved }) {
  const isEdit = !!editing;
  const [username, setUsername] = useState(editing?.username || '');
  const [nombre,   setNombre]   = useState(editing?.nombre   || '');
  const [rol,      setRol]      = useState(editing?.rol      || 'operador');
  const [pass,     setPass]     = useState('');
  const [passConf, setPassConf] = useState('');
  const [saving,   setSaving]   = useState(false);
  const [err,      setErr]      = useState('');

  const validate = () => {
    if (!username.trim()) return 'El nombre de usuario es requerido.';
    if (!/^[a-zA-Z0-9_.-]+$/.test(username.trim())) return 'Usuario: solo letras, números, _ . -';
    if (!nombre.trim()) return 'El nombre completo es requerido.';
    if (!isEdit && !pass) return 'La contraseña es requerida.';
    if (pass && pass.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
    if (pass && pass !== passConf) return 'Las contraseñas no coinciden.';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErr = validate();
    if (validationErr) { setErr(validationErr); return; }
    setSaving(true);
    setErr('');
    try {
      if (isEdit) {
        const updates = { nombre: nombre.trim(), rol, username: username.trim() };
        if (pass) {
          const hash = await hash(pass, 10);
          await authDb.changePassword(editing.id, hash);
        }
        const { error } = await authDb.updateUsuario(editing.id, updates);
        if (error) throw error;
      } else {
        const hash = await hash(pass, 10);
        const { error } = await authDb.createUsuario({
          username:      username.trim(),
          nombre:        nombre.trim(),
          password_hash: hash,
          rol,
        });
        if (error) throw error;
      }
      onSaved();
      onClose();
    } catch (e) {
      setErr(e.message || 'Error al guardar usuario.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={isEdit ? '✏️ Editar Usuario' : '➕ Nuevo Usuario'} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="grid-2" style={{ gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Usuario</label>
            <input
              className="form-input"
              value={username}
              onChange={e => { setUsername(e.target.value); setErr(''); }}
              placeholder="ej: jperez"
              style={{ fontFamily: "'DM Mono',monospace" }}
              disabled={isEdit} // username cannot change after creation
            />
          </div>
          <div className="form-group">
            <label className="form-label">Rol</label>
            <select className="form-select" value={rol} onChange={e => setRol(e.target.value)}>
              <option value="admin">👑 Admin</option>
              <option value="operador">🎲 Operador</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Nombre Completo</label>
          <input
            className="form-input"
            value={nombre}
            onChange={e => { setNombre(e.target.value); setErr(''); }}
            placeholder="ej: Juan Pérez"
            style={{ fontFamily: "'Outfit',sans-serif", fontSize: 14 }}
          />
        </div>
        <div className="grid-2" style={{ gap: 14 }}>
          <div className="form-group">
            <label className="form-label">{isEdit ? 'Nueva Contraseña (opcional)' : 'Contraseña'}</label>
            <PasswordInput value={pass} onChange={e => { setPass(e.target.value); setErr(''); }} />
          </div>
          <div className="form-group">
            <label className="form-label">Confirmar Contraseña</label>
            <PasswordInput value={passConf} onChange={e => { setPassConf(e.target.value); setErr(''); }} placeholder="Repetir contraseña" />
          </div>
        </div>

        {err && <Alert type="error">⚠️ {err}</Alert>}

        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 1 }}>
            {saving ? <><LoadingSpinner size={16} /> Guardando…</> : (isEdit ? 'Guardar Cambios' : 'Crear Usuario')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Change own password modal ─────────────────────────────────────────────
function ChangePasswordModal({ userId, onClose }) {
  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving]   = useState(false);
  const [err, setErr]         = useState('');
  const [ok, setOk]           = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!current) { setErr('Ingrese su contraseña actual.'); return; }
    if (newPass.length < 6) { setErr('La nueva contraseña debe tener al menos 6 caracteres.'); return; }
    if (newPass !== confirm) { setErr('Las contraseñas no coinciden.'); return; }
    setSaving(true);
    setErr('');
    try {
      // Verify current password
      const { data: user } = await authDb.getUserByUsername(userId.username);
      if (!user || !(await compare(current, user.password_hash))) {
        setErr('La contraseña actual es incorrecta.');
        setSaving(false);
        return;
      }
      const hash = await hash(newPass, 10);
      const { error } = await authDb.changePassword(userId.id, hash);
      if (error) throw error;
      setOk(true);
    } catch (e) {
      setErr(e.message || 'Error al cambiar contraseña.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="🔑 Cambiar Mi Contraseña" onClose={onClose}>
      {ok ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--green)' }}>Contraseña actualizada</div>
          <button className="btn btn-primary" onClick={onClose} style={{ marginTop: 20 }}>Cerrar</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Contraseña Actual</label>
            <PasswordInput value={current} onChange={e => { setCurrent(e.target.value); setErr(''); }} placeholder="Contraseña actual" autoComplete="current-password" />
          </div>
          <div className="form-group">
            <label className="form-label">Nueva Contraseña</label>
            <PasswordInput value={newPass} onChange={e => { setNewPass(e.target.value); setErr(''); }} placeholder="Mínimo 6 caracteres" />
          </div>
          <div className="form-group">
            <label className="form-label">Confirmar Nueva Contraseña</label>
            <PasswordInput value={confirm} onChange={e => { setConfirm(e.target.value); setErr(''); }} placeholder="Repetir nueva contraseña" />
          </div>
          {err && <Alert type="error">⚠️ {err}</Alert>}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 1 }}>
              {saving ? <><LoadingSpinner size={16} /> Guardando…</> : 'Cambiar Contraseña'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function ConfiguracionPage() {
  const { currentUser, isAdmin } = useAuth();
  const [usuarios, setUsuarios]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(null);  // null | 'new' | { user } | 'own-pass'
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]     = useState(false);
  const [alert, setAlert]           = useState(null);

  const loadUsuarios = useCallback(async () => {
    setLoading(true);
    const { data, error } = await authDb.getUsuarios();
    if (!error) setUsuarios(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadUsuarios(); }, [loadUsuarios]);

  const handleDelete = async (u) => {
    if (!window.confirm(`¿Eliminar permanentemente al usuario "${u.username}"? Esta acción no se puede deshacer.`)) return;
    setDeleting(true);
    const { error } = await authDb.hardDeleteUsuario(u.id);
    if (error) {
      setAlert({ type: 'error', msg: error.message });
    } else {
      setAlert({ type: 'success', msg: `Usuario "${u.username}" eliminado.` });
      loadUsuarios();
    }
    setDeleting(false);
    setTimeout(() => setAlert(null), 4000);
  };

  const handleToggleActivo = async (u) => {
    const { error } = await authDb.updateUsuario(u.id, { activo: !u.activo });
    if (error) {
      setAlert({ type: 'error', msg: error.message });
    } else {
      loadUsuarios();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 900 }}>
      {/* ── Header ── */}
      <div>
        <div className="section-title">Configuración</div>
        <div className="section-sub">Gestión de usuarios y accesos del sistema</div>
      </div>

      {/* ── Mi cuenta ── */}
      <div className="card card-gold">
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
          Mi Cuenta
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--gold), var(--gold2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, flexShrink: 0,
            }}>
              {currentUser?.rol === 'admin' ? '👑' : '🎲'}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{currentUser?.nombre}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <span className="mono" style={{ fontSize: 12, color: 'var(--text-dim)' }}>@{currentUser?.username}</span>
                <RolBadge rol={currentUser?.rol} />
              </div>
            </div>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => setModal('own-pass')}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            🔑 Cambiar mi contraseña
          </button>
        </div>
      </div>

      {/* ── Users table (admin only) ── */}
      {isAdmin && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Usuarios del Sistema</div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
                {usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''} registrado{usuarios.length !== 1 ? 's' : ''}
              </div>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => setModal('new')}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              ＋ Nuevo Usuario
            </button>
          </div>

          {alert && (
            <div style={{ marginBottom: 16 }}>
              <Alert type={alert.type}>{alert.msg}</Alert>
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
              <LoadingSpinner size={32} />
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Nombre</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Creado</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map(u => (
                    <tr key={u.id} style={{ opacity: u.activo ? 1 : 0.5 }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: u.activo ? 'linear-gradient(135deg,var(--gold),var(--gold2))' : 'var(--surface3)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 14, flexShrink: 0,
                          }}>
                            {u.rol === 'admin' ? '👑' : '🎲'}
                          </div>
                          <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>@{u.username}</span>
                          {u.username === currentUser?.username && (
                            <span style={{ fontSize: 10, background: 'rgba(46,204,139,0.12)', color: 'var(--green)', border: '1px solid rgba(46,204,139,0.3)', borderRadius: 100, padding: '1px 7px', fontWeight: 700 }}>
                              Tú
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ fontSize: 13 }}>{u.nombre}</td>
                      <td><RolBadge rol={u.rol} /></td>
                      <td>
                        <button
                          onClick={() => handleToggleActivo(u)}
                          disabled={u.username === currentUser?.username}
                          title={u.activo ? 'Desactivar usuario' : 'Activar usuario'}
                          style={{
                            background: u.activo ? 'rgba(46,204,139,0.1)' : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${u.activo ? 'rgba(46,204,139,0.3)' : 'var(--border)'}`,
                            color: u.activo ? 'var(--green)' : 'var(--text-dim)',
                            padding: '3px 10px', borderRadius: 100, cursor: 'pointer',
                            fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                          }}
                        >
                          {u.activo ? '● Activo' : '○ Inactivo'}
                        </button>
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                        {new Date(u.created_at).toLocaleDateString('es-DO')}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setModal({ user: u })}
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(u)}
                            disabled={u.username === currentUser?.username || deleting}
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Info for non-admin ── */}
      {!isAdmin && (
        <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
          <div style={{ fontSize: 14, color: 'var(--text-dim)' }}>
            Solo los administradores pueden gestionar usuarios.
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {modal === 'new' && (
        <UserModal editing={null} onClose={() => setModal(null)} onSaved={loadUsuarios} />
      )}
      {modal?.user && (
        <UserModal editing={modal.user} onClose={() => setModal(null)} onSaved={loadUsuarios} />
      )}
      {modal === 'own-pass' && (
        <ChangePasswordModal userId={currentUser} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
