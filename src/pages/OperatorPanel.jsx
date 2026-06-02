import { useState, useCallback, useEffect } from 'react';
import { db } from '../services/supabase';
import { generateCode, fmt, padLote, POSICION_LABELS, POSICION_COLORS, POSICION_ICONS } from '../utils';
import {
  canRegisterOferente,
  validateCodeForLoteTipo,
  findPrincipalWin,
  formatPrincipalWinMessage,
} from '../services/sorteoRules';
import { LoadingSpinner, Alert, GanadorCard } from '../components/UI';

export default function OperatorPanel({
  lotes, items, oferentes, resultados, loteActivo, onRefresh, onDelete, onLoteActivoChange,
}) {
  const [selectedLote, setSelectedLote] = useState(null);
  const [posicion, setPosicion] = useState(1);
  const [numero, setNumero] = useState('');
  const [oferente, setOferente] = useState(null);
  const [alert, setAlert] = useState(null);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState('all'); // 'all' | 'A' | 'B'

  useEffect(() => {
    if (!loteActivo || !lotes.length) return;
    if (selectedLote?.id === loteActivo.id) return;
    setSelectedLote(loteActivo);
  }, [loteActivo, lotes, selectedLote?.id]);

  const lotesFiltrados = lotes.filter(l => {
    if (filtroTipo === 'all') return true;
    return (l.tipo || '').toUpperCase() === filtroTipo;
  });

  const loteItems      = selectedLote ? items.filter(it => it.lote_id === selectedLote.id) : [];
  const loteResultados = selectedLote ? resultados.filter(r => r.lote_id === selectedLote.id) : [];
  const completedSet   = new Set(resultados.filter(r => r.posicion === 1).map(r => r.lote_id));

  const codigoBuscado =
    selectedLote && numero.trim()
      ? generateCode(selectedLote.tipo, numero.trim())
      : '';

  // ── Search ──────────────────────────────────────────────────────
  const buscarOferente = useCallback(async () => {
    if (!codigoBuscado) return;
    setSearching(true);
    setAlert(null);
    setOferente(null);
    try {
      const { data, error } = await db.getOferenteByCode(codigoBuscado);
      if (error) throw error;
      if (!data) {
        setAlert({
          type: 'error',
          msg: `No se encontró oferente con código ${codigoBuscado} (tombola ${selectedLote.tipo}, número ${numero.trim().padStart(3, '0')}).`,
        });
        return;
      }

      const tipoCheck = validateCodeForLoteTipo(data.codigo, selectedLote.tipo);
      if (!tipoCheck.ok) {
        setAlert({ type: 'error', msg: tipoCheck.message });
        return;
      }

      const prevWin = findPrincipalWin(data, resultados, lotes, oferentes);
      if (prevWin) {
        setAlert({ type: 'error', msg: formatPrincipalWinMessage(data, prevWin.lote) });
        return;
      }

      setOferente(data);
    } catch (e) {
      setAlert({ type: 'error', msg: e.message || 'Error al buscar oferente' });
    } finally {
      setSearching(false);
    }
  }, [codigoBuscado, selectedLote, numero, resultados, lotes, oferentes]);

  // ── Register ─────────────────────────────────────────────────────
  const registrar = async () => {
    if (!oferente || !selectedLote) return;
    setSaving(true);
    setAlert(null);
    try {
      const elegibilidad = canRegisterOferente(oferente, resultados, lotes, oferentes);
      if (!elegibilidad.ok) {
        setAlert({ type: 'error', msg: elegibilidad.message });
        return;
      }
      const yaTomado = loteResultados.find(r => r.posicion === posicion);
      if (yaTomado) {
        setAlert({ type: 'error', msg: `La posición "${POSICION_LABELS[posicion]}" ya está registrada para este lote.` });
        return;
      }
      const { data: nuevo, error } = await db.insertResultado({
        lote_id:         selectedLote.id,
        oferente_id:     oferente.id,
        codigo_oferente: oferente.codigo,
        nombre_oferente: oferente.nombre_oferente,
        rnc:             oferente.rnc,
        rpe:             oferente.rpe,
        lote_habilitado: oferente.lote_habilitado,
        posicion,
      });
      if (error) throw error;
      setAlert({ type: 'success', msg: `✓ ${POSICION_LABELS[posicion]} registrado correctamente.` });
      setNumero('');
      setOferente(null);
      await onRefresh(nuevo);
    } catch (e) {
      setAlert({ type: 'error', msg: e.message || 'Error al registrar' });
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar este resultado?')) return;
    const { error } = await db.deleteResultado(id);
    if (error) {
      setAlert({ type: 'error', msg: error.message || 'No se pudo eliminar' });
      return;
    }
    // Use refreshAfterDelete so the UI updates immediately
    if (onDelete) await onDelete(id);
    else await onRefresh();
  };

  const selectLote = (l) => {
    setSelectedLote(l);
    setNumero('');
    setOferente(null);
    setAlert(null);
    onLoteActivoChange?.(l);
  };

  const cambiarFiltro = (tipo) => {
    setFiltroTipo(tipo);
    if (
      selectedLote &&
      tipo !== 'all' &&
      (selectedLote.tipo || '').toUpperCase() !== tipo
    ) {
      setSelectedLote(null);
      setNumero('');
      setOferente(null);
      setAlert(null);
    }
  };

  const ocultarPantallaPublica = () => {
    setSelectedLote(null);
    setNumero('');
    setOferente(null);
    setAlert({
      type: 'success',
      msg: 'Pantalla Pública ocultada. No se mostrará ningún lote hasta seleccionar uno nuevo.',
    });
    onLoteActivoChange?.(null);
  };

  return (
    <div>
      <div className="section-header">
        <div className="section-title">Panel del Operador</div>
        <div className="section-sub">Gestión del sorteo en tiempo real</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, alignItems: 'start' }}>

        {/* ── LEFT: lote list ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
              Seleccionar Lote
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={ocultarPantallaPublica}
              style={{ width: '100%', marginBottom: 10 }}
              title="Ocultar lote en Pantalla Pública"
            >
              Ocultar en Pantalla Pública
            </button>
            <div className="lote-filter" role="group" aria-label="Filtrar por tipo de lote">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'A', label: 'A' },
                { id: 'B', label: 'B' },
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  className={`lote-filter-btn${filtroTipo === f.id ? ' active' : ''}`}
                  onClick={() => cambiarFiltro(f.id)}
                >
                  {f.id === 'all' ? f.label : <span className={`badge badge-${f.id.toLowerCase()}`}>{f.label}</span>}
                </button>
              ))}
            </div>
            <div style={{ maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3, marginTop: 12 }}>
              {lotesFiltrados.length === 0 ? (
                <div style={{ padding: '20px 12px', textAlign: 'center', fontSize: 13, color: 'var(--text-dim)' }}>
                  No hay lotes tipo {filtroTipo}
                </div>
              ) : lotesFiltrados.map(l => (
                <div
                  key={l.id}
                  onClick={() => selectLote(l)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    border: '1px solid transparent',
                    background: selectedLote?.id === l.id ? 'var(--gold-dim)' : 'transparent',
                    borderColor: selectedLote?.id === l.id ? 'rgba(26,54,104,0.4)' : 'transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="mono" style={{ fontSize: 13, fontWeight: 500 }}>
                      Lote {padLote(l.numero_lote)}
                    </span>
                    <span className={`badge badge-${l.tipo.toLowerCase()}`}>{l.tipo}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                      {(l.monto_lote / 1e6).toFixed(1)}M
                    </span>
                    {completedSet.has(l.id) && (
                      <span style={{ color: 'var(--green)', fontSize: 14 }}>✓</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {filtroTipo !== 'all' && (
              <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-dim)', textAlign: 'center' }}>
                {lotesFiltrados.length} de {lotes.length} lotes
              </div>
            )}
          </div>

          {/* Lote detail card */}
          {selectedLote && (
            <div className="card card-gold">
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Lote Seleccionado
                </div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: 'var(--gold2)', marginTop: 2 }}>
                  Lote {padLote(selectedLote.numero_lote)}{' '}
                  <span className={`badge badge-${selectedLote.tipo.toLowerCase()}`} style={{ fontSize: 12, verticalAlign: 'middle' }}>
                    {selectedLote.tipo}
                  </span>
                </div>
                <div className="mono" style={{ fontSize: 15, color: 'var(--gold)', marginTop: 6 }}>
                  {fmt(selectedLote.monto_lote)}
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Centros Educativos ({loteItems.length})
              </div>
              {loteItems.map((it, i) => (
                <div key={i} style={{
                  fontSize: 12, padding: '6px 0', borderBottom: '1px solid var(--border)',
                  display: 'flex', justifyContent: 'space-between', gap: 8,
                }}>
                  <span style={{ color: 'var(--text)', flex: 1, lineHeight: 1.4 }}>
                    {it.nombre_centro_educativo}
                  </span>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--text-dim)', flexShrink: 0 }}>
                    {(it.monto_obra / 1e6).toFixed(1)}M
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT: form + results ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {!selectedLote ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-text">Seleccione un lote de la lista para comenzar</div>
              </div>
            </div>
          ) : (
            <>
              {/* Results for current lote */}
              <div className="card">
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
                  Resultados — Lote {padLote(selectedLote.numero_lote)}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {[1, 2, 3].map(pos => (
                    <GanadorCard
                      key={pos}
                      posicion={pos}
                      resultado={loteResultados.find(r => r.posicion === pos)}
                      onDelete={eliminar}
                    />
                  ))}
                </div>
              </div>

              {/* Registration form */}
              <div className="card card-gold">
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 20 }}>Registrar Ganador</div>

                <div className="grid-2" style={{ gap: 14, marginBottom: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Posición</label>
                    <select
                      className="form-select"
                      value={posicion}
                      onChange={e => { setPosicion(Number(e.target.value)); setOferente(null); setAlert(null); }}
                    >
                      {[1, 2, 3].map(p => (
                        <option key={p} value={p}>{POSICION_ICONS[p]} {POSICION_LABELS[p]}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Número en tombola {selectedLote.tipo}
                    </label>
                    <input
                      className="form-input"
                      type="number"
                      min={1}
                      max={999}
                      value={numero}
                      placeholder={selectedLote.tipo === 'A' ? '005' : '016'}
                      onChange={e => { setNumero(e.target.value); setOferente(null); setAlert(null); }}
                      onKeyDown={e => e.key === 'Enter' && buscarOferente()}
                    />
                  </div>
                </div>

                {/* Code preview */}
                {codigoBuscado && (
                  <div style={{
                    padding: '10px 14px', background: 'var(--surface3)',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: "'DM Mono',monospace", fontSize: 14, color: 'var(--gold2)',
                    letterSpacing: '0.05em', marginBottom: 14,
                    border: '1px solid rgba(26,54,104,0.28)',
                  }}>
                    🔑 {codigoBuscado}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                  <button
                    className="btn btn-secondary"
                    onClick={buscarOferente}
                    disabled={!numero || searching}
                    style={{ flex: 1 }}
                  >
                    {searching ? <LoadingSpinner size={16} /> : '🔍 Buscar Oferente'}
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={registrar}
                    disabled={!oferente || saving}
                    style={{ flex: 1 }}
                  >
                    {saving ? <LoadingSpinner size={16} /> : '✓ Registrar'}
                  </button>
                </div>

                {alert && (
                  <div style={{ marginBottom: 16 }}>
                    <Alert type={alert.type}>{alert.msg}</Alert>
                  </div>
                )}

                {/* Oferente result card */}
                {oferente && (
                  <div style={{
                    padding: 20,
                    background: 'linear-gradient(135deg, var(--surface2), rgba(26,54,104,0.06))',
                    border: '1px solid rgba(26,54,104,0.32)',
                    borderRadius: 'var(--radius)',
                    animation: 'slideIn 0.3s ease',
                  }}>
                    <div style={{
                      fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700,
                      color: 'var(--gold2)', marginBottom: 14,
                    }}>
                      {oferente.nombre_oferente}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {[
                        { k: 'Código',             v: oferente.codigo },
                        { k: 'RNC',               v: oferente.rnc },
                        { k: 'RPE',               v: oferente.rpe },
                        { k: 'Lotes Habilitados', v: oferente.lote_habilitado },
                      ].map(({ k, v }) => (
                        <div key={k}>
                          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-dim)', marginBottom: 3 }}>{k}</div>
                          <div className="mono" style={{ fontSize: 13, fontWeight: 500 }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
