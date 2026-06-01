import { useState } from 'react';
import { fmt, padLote, POSICION_LABELS, POSICION_COLORS, POSICION_ICONS } from '../utils';

// ── Stat pill ────────────────────────────────────────────────────────────
function StatPill({ icon, label, value, color }) {
  return (
    <div style={{
      background: 'var(--surface2)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '14px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{ fontSize: 26 }}>{icon}</div>
      <div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 22, fontWeight: 600, color: color || 'var(--text)' }}>
          {value}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {label}
        </div>
      </div>
    </div>
  );
}

// ── Ganador row ──────────────────────────────────────────────────────────
function GanadorRow({ posicion, resultado }) {
  const c = POSICION_COLORS[posicion];
  return (
    <div style={{
      background: posicion === 1 ? 'linear-gradient(135deg,#141008,#1c1a0a)' : 'var(--surface2)',
      border: `1px solid ${c}40`,
      borderRadius: 10, padding: '12px 14px',
      display: 'flex', alignItems: 'flex-start', gap: 12,
    }}>
      <div style={{ fontSize: 22, flexShrink: 0 }}>{POSICION_ICONS[posicion]}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: c, fontWeight: 700, marginBottom: 4 }}>
          {POSICION_LABELS[posicion]}
        </div>
        {resultado ? (
          <>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', lineHeight: 1.3, marginBottom: 3, wordBreak: 'break-word' }}>
              {resultado.nombre_oferente}
            </div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>
              {resultado.codigo_oferente}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--text-dim)' }} className="pulse">
            Esperando…
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────
export default function PublicMobile({ lotes, items, oferentes, resultados }) {
  const [tab, setTab] = useState('resumen'); // 'resumen' | 'ganadores'

  // Stats
  const ganadores1    = resultados.filter(r => r.posicion === 1);
  const sorteadosSet  = new Set(ganadores1.map(r => r.lote_id));
  const pendientes    = lotes.length - sorteadosSet.size;
  const pct           = lotes.length ? Math.round((sorteadosSet.size / lotes.length) * 100) : 0;

  // Current lote (last with any resultado)
  const lotesConRes   = lotes.filter(l => resultados.some(r => r.lote_id === l.id)).sort((a, b) => a.numero_lote - b.numero_lote);
  const currentLote   = lotesConRes[lotesConRes.length - 1] || null;
  const currentRes    = currentLote ? resultados.filter(r => r.lote_id === currentLote.id).sort((a, b) => a.posicion - b.posicion) : [];
  const currentItems  = currentLote ? items.filter(it => it.lote_id === currentLote.id) : [];

  // All adjudicated lotes for ganadores tab
  const lotesAdjudicados = [...lotesConRes].reverse();

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 40 }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0e1318, #141c24)',
        border: '1px solid rgba(201,168,76,0.2)',
        borderRadius: 16, padding: '20px 18px', marginBottom: 20,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>⚖️</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: 'var(--gold2)' }}>
          Sorteo DIE-2026-S01
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Dirección de Infraestructura Escolar · 2026
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10,
          background: 'rgba(46,204,139,0.1)', border: '1px solid rgba(46,204,139,0.3)',
          borderRadius: 100, padding: '3px 12px',
        }}>
          <div style={{ width: 6, height: 6, background: 'var(--green)', borderRadius: '50%' }} className="pulse" />
          <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>En vivo</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 10, padding: 4, marginBottom: 20, gap: 4,
      }}>
        {[
          { id: 'resumen',   label: '📊 Resumen' },
          { id: 'ganadores', label: '🏆 Ganadores' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: tab === t.id ? 'linear-gradient(135deg, var(--gold), #a8832a)' : 'transparent',
              border: 'none', borderRadius: 8, padding: '10px',
              fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 600,
              color: tab === t.id ? '#000' : 'var(--text-dim)',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: RESUMEN ── */}
      {tab === 'resumen' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <StatPill icon="📦" label="Total Lotes"    value={lotes.length}      color="var(--accent2)" />
            <StatPill icon="✅" label="Sorteados"      value={sorteadosSet.size} color="var(--green)" />
            <StatPill icon="⏳" label="Pendientes"     value={pendientes}        color="var(--amber)" />
            <StatPill icon="🏢" label="Oferentes"      value={oferentes.length}  color="var(--gold)" />
          </div>

          {/* Progress */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Progreso del Sorteo</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 22, fontWeight: 600, color: 'var(--gold2)' }}>
                {pct}%
              </div>
            </div>
            <div style={{ height: 8, background: 'var(--surface3)', borderRadius: 8, overflow: 'hidden', marginBottom: 10 }}>
              <div style={{
                height: '100%', width: `${pct}%`,
                background: 'linear-gradient(90deg, var(--gold), var(--gold2))',
                borderRadius: 8, transition: 'width 1s ease',
              }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 3 }}>
              {lotes.map(l => (
                <div key={l.id} title={`Lote ${l.numero_lote}`} style={{
                  height: 22, borderRadius: 3,
                  background: sorteadosSet.has(l.id)
                    ? (l.tipo === 'A' ? 'rgba(61,127,255,0.6)' : 'rgba(201,168,76,0.6)')
                    : 'var(--surface3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontFamily: "'DM Mono',monospace",
                  color: sorteadosSet.has(l.id) ? '#fff' : 'var(--text-dim)',
                }}>
                  {l.numero_lote}
                </div>
              ))}
            </div>
          </div>

          {/* Lote actual */}
          {currentLote ? (
            <div style={{
              background: 'linear-gradient(135deg, #0e1318, #141a22)',
              border: '1px solid rgba(201,168,76,0.25)',
              borderRadius: 14, padding: 18,
            }}>
              <div style={{ fontSize: 11, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
                Lote Actual
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
                <div style={{
                  fontFamily: "'Playfair Display',serif", fontSize: 48, fontWeight: 900,
                  background: 'linear-gradient(135deg, var(--gold), var(--gold2))',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1,
                }}>
                  {padLote(currentLote.numero_lote)}
                </div>
                <span className={`badge badge-${currentLote.tipo.toLowerCase()}`} style={{ fontSize: 12 }}>
                  Tipo {currentLote.tipo}
                </span>
              </div>
              <div className="mono" style={{ fontSize: 16, color: 'var(--gold2)', marginBottom: 14 }}>
                {fmt(currentLote.monto_lote)}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[1, 2, 3].map(pos => (
                  <GanadorRow key={pos} posicion={pos} resultado={currentRes.find(r => r.posicion === pos)} />
                ))}
              </div>

              {/* Items compacto */}
              {currentItems.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                    Centros Educativos ({currentItems.length})
                  </div>
                  {currentItems.map((it, i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                      padding: '6px 0', borderBottom: '1px solid var(--border)', gap: 8,
                    }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.3 }}>{it.nombre_centro_educativo}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>📍 {it.provincia}</div>
                      </div>
                      <div className="mono" style={{ fontSize: 11, color: 'var(--gold)', flexShrink: 0 }}>
                        {fmt(it.monto_obra)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)' }}>
              <div style={{ fontSize: 40 }} className="pulse">⚖️</div>
              <div style={{ marginTop: 12, fontSize: 13 }}>En espera de resultados…</div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: GANADORES ── */}
      {tab === 'ganadores' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {lotesAdjudicados.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)' }}>
              <div style={{ fontSize: 40 }}>🏆</div>
              <div style={{ marginTop: 12, fontSize: 13 }}>Aún no hay ganadores registrados</div>
            </div>
          )}
          {lotesAdjudicados.map(l => {
            const loteRes   = resultados.filter(r => r.lote_id === l.id).sort((a, b) => a.posicion - b.posicion);
            const loteItems = items.filter(it => it.lote_id === l.id);
            const g1        = loteRes.find(r => r.posicion === 1);
            return (
              <div key={l.id} style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '14px 16px',
                animation: 'fadeIn 0.4s ease',
              }}>
                {/* Lote label */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span className="mono" style={{ fontSize: 15, fontWeight: 700 }}>
                    Lote {padLote(l.numero_lote)}
                  </span>
                  <span className={`badge badge-${l.tipo.toLowerCase()}`}>{l.tipo}</span>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 'auto' }}>
                    {fmt(l.monto_lote)}
                  </span>
                </div>

                {/* Winners */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[1, 2, 3].map(pos => (
                    <GanadorRow key={pos} posicion={pos} resultado={loteRes.find(r => r.posicion === pos)} />
                  ))}
                </div>

                {/* Centros */}
                {loteItems.length > 0 && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                      Centros ({loteItems.length})
                    </div>
                    {loteItems.map((it, i) => (
                      <div key={i} style={{ fontSize: 11, color: 'var(--text-dim)', padding: '2px 0' }}>
                        • {it.nombre_centro_educativo} <span style={{ color: 'var(--text-dim)', opacity: 0.6 }}>({it.provincia})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
