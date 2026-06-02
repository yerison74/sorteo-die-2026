import { useState } from 'react';
import SyncStatus from '../components/SyncStatus';
import { ProgresoGeneralSorteo, LoteTipoPanel } from '../components/SorteoProgressPanels';
import { fmt, padLote, POSICION_LABELS, POSICION_COLORS, POSICION_ICONS, resolveLoteEnVivo } from '../utils';

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

export default function PublicMobile({ lotes, items, resultados, loteActivo, lastSyncAt, syncing }) {
  const [tab, setTab] = useState('resumen');

  const ganadores1 = resultados.filter((r) => r.posicion === 1);
  const sorteadosSet = new Set(ganadores1.map((r) => r.lote_id));

  const lotesConRes = lotes
    .filter((l) => resultados.some((r) => r.lote_id === l.id))
    .sort((a, b) => a.numero_lote - b.numero_lote);
  const currentLote = loteActivo || resolveLoteEnVivo(lotes, null, resultados);
  const currentRes = currentLote
    ? resultados.filter((r) => r.lote_id === currentLote.id).sort((a, b) => a.posicion - b.posicion)
    : [];
  const currentItems = currentLote ? items.filter((it) => it.lote_id === currentLote.id) : [];
  const lotesAdjudicados = [...lotesConRes].reverse();
  const loteActivoId = loteActivo?.id ?? null;

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', paddingBottom: 40 }}>

      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border2)',
        borderRadius: 16, padding: '20px 18px', marginBottom: 16,
        textAlign: 'center',
        boxShadow: 'var(--shadow-md)',
      }}>
        <img src="/logoDie.png" alt="DIE" className="brand-logo-sm" style={{ marginBottom: 10 }} />
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: 'var(--gold2)' }}>
          Sorteo DIE-2026-S01
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Seguimiento en vivo
        </div>
        <div style={{ marginTop: 12 }}>
          <SyncStatus lastSyncAt={lastSyncAt} syncing={syncing} />
        </div>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 10, padding: 4, marginBottom: 16, gap: 4,
      }}>
        {[
          { id: 'resumen', label: '📊 Progreso' },
          { id: 'ganadores', label: '🏆 Ganadores' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
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

      {tab === 'resumen' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <ProgresoGeneralSorteo lotes={lotes} sorteadosSet={sorteadosSet} />
          <LoteTipoPanel tipo="A" lotes={lotes} sorteadosSet={sorteadosSet} loteActivoId={loteActivoId} />
          <LoteTipoPanel tipo="B" lotes={lotes} sorteadosSet={sorteadosSet} loteActivoId={loteActivoId} />

          {currentLote && (
            <div className="card">
              <div style={{ fontSize: 11, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
                Lote en curso
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
                <div style={{
                  fontFamily: "'Playfair Display',serif", fontSize: 42, fontWeight: 900,
                  color: 'var(--brand-navy)', lineHeight: 1,
                }}>
                  {padLote(currentLote.numero_lote)}
                </div>
                <span className={`badge badge-${currentLote.tipo.toLowerCase()}`}>{currentLote.tipo}</span>
              </div>
              <div className="mono" style={{ fontSize: 15, color: 'var(--gold2)', marginBottom: 14 }}>
                {fmt(currentLote.monto_lote)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[1, 2, 3].map((pos) => (
                  <GanadorRow key={pos} posicion={pos} resultado={currentRes.find((r) => r.posicion === pos)} />
                ))}
              </div>
              {currentItems.length > 0 && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                    Centros educativos ({currentItems.length})
                  </div>
                  {currentItems.map((it, i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', gap: 8,
                      padding: '6px 0', borderBottom: '1px solid var(--border)',
                    }}>
                      <div style={{ fontSize: 12, lineHeight: 1.3 }}>{it.nombre_centro_educativo}</div>
                      <div className="mono" style={{ fontSize: 11, color: 'var(--text-dim)', flexShrink: 0 }}>
                        {it.provincia}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'ganadores' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {lotesAdjudicados.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)' }}>
              <div style={{ fontSize: 40 }}>🏆</div>
              <div style={{ marginTop: 12, fontSize: 13 }}>Aún no hay ganadores registrados</div>
            </div>
          )}
          {lotesAdjudicados.map((l) => {
            const loteRes = resultados.filter((r) => r.lote_id === l.id).sort((a, b) => a.posicion - b.posicion);
            const loteItems = items.filter((it) => it.lote_id === l.id);
            return (
              <div key={l.id} className="card" style={{ animation: 'fadeIn 0.4s ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span className="mono" style={{ fontSize: 15, fontWeight: 700 }}>
                    Lote {padLote(l.numero_lote)}
                  </span>
                  <span className={`badge badge-${l.tipo.toLowerCase()}`}>{l.tipo}</span>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 'auto' }}>
                    {fmt(l.monto_lote)}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[1, 2, 3].map((pos) => (
                    <GanadorRow key={pos} posicion={pos} resultado={loteRes.find((r) => r.posicion === pos)} />
                  ))}
                </div>
                {loteItems.length > 0 && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 6 }}>
                      Centros ({loteItems.length})
                    </div>
                    {loteItems.map((it, i) => (
                      <div key={i} style={{ fontSize: 11, color: 'var(--text-dim)', padding: '2px 0' }}>
                        • {it.nombre_centro_educativo} ({it.provincia})
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
