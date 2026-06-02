import { useState } from 'react';
import SyncStatus from '../components/SyncStatus';
import { fmt, padLote, POSICION_LABELS, POSICION_COLORS, POSICION_ICONS, resolveLoteEnVivo } from '../utils';

// ── Stat pill ────────────────────────────────────────────────────────────
function StatPill({ icon, label, value, color }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '14px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: 'var(--shadow-sm)',
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
      background: posicion === 1 ? 'linear-gradient(135deg,#eef4fc,#ffffff)' : 'var(--surface)',
      border: `1px solid ${c}40`,
      borderRadius: 10, padding: '12px 14px',
      boxShadow: 'var(--shadow-sm)',
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
export default function PublicMobile({ lotes, items, resultados, loteActivo, lastSyncAt, syncing, estadoLoaded }) {
  const [tab, setTab] = useState('resumen'); // 'resumen' | 'ganadores'

  // Stats
  const ganadores1    = resultados.filter(r => r.posicion === 1);
  const sorteadosSet  = new Set(ganadores1.map(r => r.lote_id));
  const pendientes    = lotes.length - sorteadosSet.size;
  const pct           = lotes.length ? Math.round((sorteadosSet.size / lotes.length) * 100) : 0;

  // Lote activo seleccionado por el operador (puede no tener resultados aún)
  // loteActivo is already null until estadoLoaded (handled in useAppData hook)
  // Both loteActivo and fallback are blocked until estadoLoaded (loteActivo=null from hook)
  const currentLote   = loteActivo; // resolveLoteEnVivo fallback removed: hook handles it
  const currentRes    = currentLote ? resultados.filter(r => r.lote_id === currentLote.id).sort((a, b) => a.posicion - b.posicion) : [];
  const currentItems  = currentLote ? items.filter(it => it.lote_id === currentLote.id) : [];

  // Ganadores tab: solo lotes con Ganador Principal confirmado (posicion === 1)
  const lotesAdjudicados = lotes
    .filter(l => resultados.some(r => r.lote_id === l.id && r.posicion === 1))
    .sort((a, b) => b.numero_lote - a.numero_lote);

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 40 }}>

      {/* Header */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border2)',
        borderRadius: 16, padding: '20px 18px', marginBottom: 20,
        textAlign: 'center',
        boxShadow: 'var(--shadow-md)',
      }}>
        <img src="/logoDie.png" alt="DIE" className="brand-logo-sm" style={{ marginBottom: 10 }} />
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: 'var(--gold2)' }}>
          Sorteo DIE-2026-S01
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Dirección de Infraestructura Escolar · 2026
        </div>
        <div style={{ marginTop: 12 }}>
          <SyncStatus lastSyncAt={lastSyncAt} syncing={syncing} />
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
              background: tab === t.id ? 'linear-gradient(135deg, var(--brand-navy), var(--brand-navy-light))' : 'transparent',
              border: 'none', borderRadius: 8, padding: '10px',
              fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 600,
              color: tab === t.id ? '#fff' : 'var(--text-dim)',
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <StatPill icon="📦" label="Total Lotes" value={lotes.length}      color="var(--accent2)" />
            <StatPill icon="✅" label="Sorteados"   value={sorteadosSet.size} color="var(--green)" />
            <StatPill icon="⏳" label="Pendientes"  value={pendientes}        color="var(--amber)" />
          </div>

          {/* Progreso general */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Progreso general del sorteo</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 20, fontWeight: 700, color: 'var(--gold2)' }}>
                {pct}%
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 10 }}>
              {sorteadosSet.size} de {lotes.length} lotes con ganador principal
            </div>
            <div style={{ height: 6, background: 'var(--surface3)', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${pct}%`,
                background: 'linear-gradient(90deg, var(--brand-navy), var(--brand-navy-light))',
                borderRadius: 6, transition: 'width 1s ease',
              }} />
            </div>
          </div>

          {/* Lotes Tipo A */}
          {['A', 'B'].map(tipo => {
            const typed = lotes
              .filter(l => (l.tipo || '').toUpperCase() === tipo)
              .sort((a, b) => a.numero_lote - b.numero_lote);
            const doneCount = typed.filter(l => sorteadosSet.has(l.id)).length;
            const tipoPct   = typed.length ? Math.round((doneCount / typed.length) * 100) : 0;
            const doneBg    = tipo === 'A' ? 'rgba(61,127,255,0.55)' : 'rgba(26,54,104,0.65)';
            const barBg     = tipo === 'A'
              ? 'linear-gradient(90deg, #3b82f6, #60a5fa)'
              : 'linear-gradient(90deg, var(--brand-navy), var(--brand-navy-light))';

            return (
              <div key={tipo} className="card">
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>Lotes Tipo {tipo}</div>
                      <span className={`badge badge-${tipo.toLowerCase()}`}>{tipo}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                      {doneCount} de {typed.length} sorteados
                    </div>
                  </div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 24, fontWeight: 700, color: 'var(--gold2)' }}>
                    {tipoPct}%
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ height: 6, background: 'var(--surface3)', borderRadius: 6, overflow: 'hidden', marginBottom: 12 }}>
                  <div style={{ height: '100%', width: `${tipoPct}%`, background: barBg, borderRadius: 6, transition: 'width 1s ease' }} />
                </div>

                {/* Lote grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                  {typed.map(l => {
                    const done = sorteadosSet.has(l.id);
                    return (
                      <div key={l.id} style={{
                        height: 32, borderRadius: 6,
                        background: done ? doneBg : 'var(--surface3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontFamily: "'DM Mono',monospace",
                        fontWeight: 600,
                        color: done ? '#fff' : 'var(--text-dim)',
                        transition: 'background 0.4s',
                      }}>
                        {l.numero_lote}
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 11, color: 'var(--text-dim)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 10, height: 10, background: doneBg, borderRadius: 2, display: 'inline-block' }} />
                    Sorteado
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 10, height: 10, background: 'var(--surface3)', borderRadius: 2, display: 'inline-block' }} />
                    Pendiente
                  </span>
                </div>
              </div>
            );
          })}

          {/* Lote actual */}
          {currentLote ? (
            <div style={{
              background: 'var(--surface)',
              border: '1px solid rgba(26,54,104,0.3)',
              borderRadius: 14, padding: 18,
            }}>
              <div style={{ fontSize: 11, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
                Lote en curso
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
              <img src="/logoDie.png" alt="DIE" className="brand-logo-sm" style={{ opacity: 0.85 }} />
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
