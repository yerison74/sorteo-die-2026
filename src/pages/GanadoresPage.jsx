import { useState } from 'react';
import { fmt, padLote, POSICION_LABELS, POSICION_COLORS, POSICION_ICONS } from '../utils';
import { SectionHeader, EmptyState } from '../components/UI';

function PosCard({ posicion, resultado }) {
  const c = POSICION_COLORS[posicion];
  return (
    <div style={{
      background: posicion === 1 ? 'linear-gradient(135deg, var(--surface2), rgba(255,215,0,0.04))' : 'var(--surface2)',
      border: `1px solid ${c}40`,
      borderRadius: 'var(--radius)', padding: 16,
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        background: c + '20', color: c, padding: '3px 8px', borderRadius: 4,
        fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
        alignSelf: 'flex-start',
      }}>
        {POSICION_ICONS[posicion]} {POSICION_LABELS[posicion]}
      </div>
      {resultado ? (
        <>
          <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{resultado.nombre_oferente}</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>{resultado.codigo_oferente}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2 }}>
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>RNC: {resultado.rnc}</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>RPE: {resultado.rpe}</div>
          </div>
        </>
      ) : (
        <div style={{ color: 'var(--text-dim)', fontSize: 12 }}>No registrado</div>
      )}
    </div>
  );
}

export default function GanadoresPage({ lotes, items, resultados }) {
  const [expanded, setExpanded] = useState(null);

  const sortedLotes = lotes
    .filter(l => resultados.some(r => r.lote_id === l.id))
    .sort((a, b) => a.numero_lote - b.numero_lote);

  if (sortedLotes.length === 0) {
    return (
      <div>
        <SectionHeader title="Ganadores del Sorteo" sub="Historial de lotes adjudicados" />
        <div className="card" style={{ marginTop: 20 }}>
          <EmptyState icon="🏆" text="Aún no hay ganadores registrados" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader title="Ganadores del Sorteo" sub={`${sortedLotes.length} lote${sortedLotes.length !== 1 ? 's' : ''} adjudicado${sortedLotes.length !== 1 ? 's' : ''}`} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sortedLotes.map(l => {
          const loteRes   = resultados.filter(r => r.lote_id === l.id).sort((a, b) => a.posicion - b.posicion);
          const loteItems = items.filter(it => it.lote_id === l.id);
          const g1        = loteRes.find(r => r.posicion === 1);
          const isOpen    = expanded === l.id;

          return (
            <div key={l.id} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', overflow: 'hidden',
              transition: 'border-color 0.2s',
            }}>
              {/* Row header */}
              <div
                onClick={() => setExpanded(isOpen ? null : l.id)}
                style={{
                  padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14,
                  cursor: 'pointer',
                }}
              >
                <span className="mono" style={{ fontSize: 16, fontWeight: 600, minWidth: 56 }}>
                  #{padLote(l.numero_lote)}
                </span>
                <span className={`badge badge-${l.tipo.toLowerCase()}`}>{l.tipo}</span>
                <div style={{ flex: 1, marginLeft: 4 }}>
                  {g1 && (
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                      {POSICION_ICONS[1]} {g1.nombre_oferente}
                    </div>
                  )}
                  <div className="mono" style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                    {fmt(l.monto_lote)}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                    {loteRes.length}/3 posiciones
                  </span>
                  <span style={{ color: 'var(--text-dim)', fontSize: 16, transition: 'transform 0.2s', transform: isOpen ? 'rotate(90deg)' : 'none' }}>
                    ▸
                  </span>
                </div>
              </div>

              {/* Expanded body */}
              {isOpen && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px 20px' }} className="fade-in">
                  {/* Three winners */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                    {[1, 2, 3].map(pos => (
                      <PosCard key={pos} posicion={pos} resultado={loteRes.find(r => r.posicion === pos)} />
                    ))}
                  </div>

                  {/* Items */}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
                      Centros Educativos ({loteItems.length})
                    </div>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Centro Educativo</th>
                          <th>Provincia</th>
                          <th>Monto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loteItems.map((it, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 500, fontSize: 13 }}>{it.nombre_centro_educativo}</td>
                            <td style={{ color: 'var(--text-dim)', fontSize: 12 }}>{it.provincia}</td>
                            <td className="mono" style={{ fontSize: 12 }}>{fmt(it.monto_obra)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
