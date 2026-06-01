import { useState, useCallback } from 'react';
import { db } from '../services/supabase';
import { generateCode, fmt, padLote, POSICION_LABELS, POSICION_COLORS, POSICION_ICONS } from '../utils';
import { LoadingSpinner, Alert, GanadorCard } from '../components/UI';

export default function OperatorPanel({ lotes, items, oferentes, resultados, onRefresh }) {
  const [selectedLote, setSelectedLote] = useState(null);
  const [posicion, setPosicion] = useState(1);
  const [numero, setNumero] = useState('');
  const [oferente, setOferente] = useState(null);
  const [alert, setAlert] = useState(null);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

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
        setAlert({ type: 'error', msg: `No se encontró ningún oferente con el código ${codigoBuscado}` });
        return;
      }
      const habilitado = (data.lote_habilitado || '').toUpperCase().trim();
      const loteType   = selectedLote.tipo.toUpperCase();
      if (loteType === 'A' && habilitado === 'B') {
        setAlert({ type: 'error', msg: 'Este oferente solo está habilitado para lotes tipo B.' });
        return;
      }
      if (loteType === 'B' && habilitado === 'A') {
        setAlert({ type: 'error', msg: 'Este oferente solo está habilitado para lotes tipo A.' });
        return;
      }
      setOferente(data);
    } catch (e) {
      setAlert({ type: 'error', msg: e.message || 'Error al buscar oferente' });
    } finally {
      setSearching(false);
    }
  }, [codigoBuscado, selectedLote]);

  // ── Register ─────────────────────────────────────────────────────
  const registrar = async () => {
    if (!oferente || !selectedLote) return;
    setSaving(true);
    setAlert(null);
    try {
      if (posicion === 1) {
        const prevWin = resultados.find(r => r.oferente_id === oferente.id && r.posicion === 1);
        if (prevWin) {
          const lg = lotes.find(l => l.id === prevWin.lote_id);
          setAlert({
            type: 'error',
            msg: `⚠️ Este oferente ya fue Ganador Principal en el Lote ${lg?.numero_lote ?? prevWin.lote_id}. No puede registrarse nuevamente como principal.`,
          });
          return;
        }
      }
      const yaTomado = loteResultados.find(r => r.posicion === posicion);
      if (yaTomado) {
        setAlert({ type: 'error', msg: `La posición "${POSICION_LABELS[posicion]}" ya está registrada para este lote.` });
        return;
      }
      const { error } = await db.insertResultado({
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
      onRefresh();
    } catch (e) {
      setAlert({ type: 'error', msg: e.message || 'Error al registrar' });
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar este resultado?')) return;
    await db.deleteResultado(id);
    onRefresh();
  };

  const selectLote = (l) => {
    setSelectedLote(l);
    setNumero('');
    setOferente(null);
    setAlert(null);
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
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
            <div style={{ maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
              {lotes.map(l => (
                <div
                  key={l.id}
                  onClick={() => selectLote(l)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    border: '1px solid transparent',
                    background: selectedLote?.id === l.id ? 'var(--gold-dim)' : 'transparent',
                    borderColor: selectedLote?.id === l.id ? 'rgba(201,168,76,0.3)' : 'transparent',
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
                    <label className="form-label">Número de Tómbola</label>
                    <input
                      className="form-input"
                      type="number"
                      min={1}
                      max={999}
                      value={numero}
                      placeholder="001"
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
                    border: '1px solid rgba(201,168,76,0.2)',
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
                    background: 'linear-gradient(135deg, var(--surface2), rgba(201,168,76,0.05))',
                    border: '1px solid rgba(201,168,76,0.3)',
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
