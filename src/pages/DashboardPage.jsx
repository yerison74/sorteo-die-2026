import { SectionHeader } from '../components/UI';
import { ProgresoGeneralSorteo, LoteTipoPanel } from '../components/SorteoProgressPanels';
import { fmt, padLote } from '../utils';

export default function DashboardPage({ lotes, items, resultados }) {
  const ganadores1 = resultados.filter((r) => r.posicion === 1);
  const sorteadosSet = new Set(ganadores1.map((r) => r.lote_id));
  const pendientes = lotes.length - sorteadosSet.size;

  const stats = [
    { label: 'Total Lotes', value: lotes.length, icon: '📦', color: 'var(--accent2)' },
    { label: 'Lotes Sorteados', value: sorteadosSet.size, icon: '✅', color: 'var(--green)' },
    { label: 'Lotes Pendientes', value: pendientes, icon: '⏳', color: 'var(--amber)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SectionHeader title="Dashboard" sub="Resumen del Sorteo DIE-2026-S01" />

      <div className="grid-3">
        {stats.map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <ProgresoGeneralSorteo lotes={lotes} sorteadosSet={sorteadosSet} />

      <div className="grid-2">
        <LoteTipoPanel tipo="A" lotes={lotes} sorteadosSet={sorteadosSet} />
        <LoteTipoPanel tipo="B" lotes={lotes} sorteadosSet={sorteadosSet} />
      </div>

      <div className="card">
        <div className="card-title" style={{ marginBottom: 16 }}>Tabla de Lotes</div>
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
              {lotes.map((l) => {
                const done = sorteadosSet.has(l.id);
                const g1 = resultados.find((r) => r.lote_id === l.id && r.posicion === 1);
                const loteItems = items.filter((it) => it.lote_id === l.id);
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
                      {done ? (
                        <span className="badge badge-green">✓ Sorteado</span>
                      ) : (
                        <span className="badge badge-pending">Pendiente</span>
                      )}
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
