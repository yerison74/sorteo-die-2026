import { SectionHeader } from '../components/UI';
import { fmt, padLote } from '../utils';

export default function DashboardPage({ lotes, items, oferentes, resultados }) {
  const ganadores1 = resultados.filter(r => r.posicion === 1);
  const sorteadosSet = new Set(ganadores1.map(r => r.lote_id));
  const pendientes = lotes.length - sorteadosSet.size;
  const pct = lotes.length ? Math.round((sorteadosSet.size / lotes.length) * 100) : 0;

  // Inversión por provincia
  const porProv = {};
  items.forEach(it => {
    const p = it.provincia || 'Sin provincia';
    porProv[p] = (porProv[p] || 0) + Number(it.monto_obra);
  });
  const provArr = Object.entries(porProv).sort((a, b) => b[1] - a[1]);
  const maxProv = provArr[0]?.[1] || 1;

  const stats = [
    { label: 'Total Lotes',              value: lotes.length,       icon: '📦', color: 'var(--accent2)' },
    { label: 'Total Oferentes',          value: oferentes.length,   icon: '🏢', color: 'var(--gold)' },
    { label: 'Lotes Sorteados',          value: sorteadosSet.size,  icon: '✅', color: 'var(--green)' },
    { label: 'Lotes Pendientes',         value: pendientes,         icon: '⏳', color: 'var(--amber)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SectionHeader title="Dashboard" sub="Resumen del Sorteo DIE-2026-S01" />

      {/* Stats */}
      <div className="grid-4">
        {stats.map((s, i) => (
          <div key={i} className="stat-card" style={{ borderColor: s.color + '35' }}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        {/* Progress */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Progreso del Sorteo</div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 3 }}>
                {sorteadosSet.size} de {lotes.length} lotes completados
              </div>
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 36, fontWeight: 500, color: 'var(--gold2)' }}>
              {pct}%
            </div>
          </div>
          <div style={{ height: 8, background: 'var(--surface3)', borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{
              height: '100%', width: `${pct}%`,
              background: 'linear-gradient(90deg, var(--gold), var(--gold2))',
              borderRadius: 8, transition: 'width 1s ease',
            }} />
          </div>
          {/* Lote grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
            {lotes.map(l => {
              const done = sorteadosSet.has(l.id);
              return (
                <div
                  key={l.id}
                  title={`Lote ${l.numero_lote} — Tipo ${l.tipo}`}
                  style={{
                    height: 30, borderRadius: 4,
                    background: done
                      ? (l.tipo === 'A' ? 'rgba(61,127,255,0.55)' : 'rgba(201,168,76,0.55)')
                      : 'var(--surface3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontFamily: "'DM Mono',monospace",
                    color: done ? '#fff' : 'var(--text-dim)',
                    transition: 'background 0.4s',
                    cursor: 'default',
                  }}
                >
                  {l.numero_lote}
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 11, color: 'var(--text-dim)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, background: 'rgba(61,127,255,0.55)', borderRadius: 2, display: 'inline-block' }} /> Tipo A
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, background: 'rgba(201,168,76,0.55)', borderRadius: 2, display: 'inline-block' }} /> Tipo B
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, background: 'var(--surface3)', borderRadius: 2, display: 'inline-block' }} /> Pendiente
            </span>
          </div>
        </div>

        {/* Inversión por provincia */}
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 18 }}>Inversión por Provincia</div>
          <div className="chart-bar-wrap">
            {provArr.map(([prov, monto]) => (
              <div key={prov} className="chart-bar-row">
                <div className="chart-bar-label">{prov}</div>
                <div className="chart-bar-track">
                  <div
                    className="chart-bar-fill"
                    style={{
                      width: `${(monto / maxProv) * 100}%`,
                      background: 'linear-gradient(90deg, var(--gold), var(--gold2))',
                    }}
                  />
                </div>
                <div className="chart-bar-val">{fmt(monto)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lotes table */}
      <div className="card">
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Tabla de Lotes</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Lote</th>
                <th>Tipo</th>
                <th>Monto</th>
                <th>Centros</th>
                <th>Ganador Principal</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {lotes.map(l => {
                const done = sorteadosSet.has(l.id);
                const g1 = resultados.find(r => r.lote_id === l.id && r.posicion === 1);
                const loteItems = items.filter(it => it.lote_id === l.id);
                return (
                  <tr key={l.id}>
                    <td className="mono" style={{ fontWeight: 600 }}>#{padLote(l.numero_lote)}</td>
                    <td><span className={`badge badge-${l.tipo.toLowerCase()}`}>{l.tipo}</span></td>
                    <td className="mono" style={{ fontSize: 12 }}>{fmt(l.monto_lote)}</td>
                    <td className="mono">{loteItems.length}</td>
                    <td style={{ fontSize: 12, maxWidth: 220 }}>
                      {g1 ? (
                        <span style={{ fontWeight: 500 }}>{g1.nombre_oferente}</span>
                      ) : (
                        <span style={{ color: 'var(--text-dim)' }}>—</span>
                      )}
                    </td>
                    <td>
                      {done
                        ? <span className="badge badge-green">✓ Sorteado</span>
                        : <span className="badge badge-pending">Pendiente</span>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
