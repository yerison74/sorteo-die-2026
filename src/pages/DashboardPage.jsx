import { SectionHeader } from '../components/UI';
import { fmt, padLote } from '../utils';

function LoteTipoPanel({ tipo, lotes, sorteadosSet }) {
  const typed = lotes
    .filter((l) => (l.tipo || '').toUpperCase() === tipo)
    .sort((a, b) => a.numero_lote - b.numero_lote);
  const doneCount = typed.filter((l) => sorteadosSet.has(l.id)).length;
  const pct = typed.length ? Math.round((doneCount / typed.length) * 100) : 0;
  const doneBg = tipo === 'A' ? 'rgba(61,127,255,0.55)' : 'rgba(26,54,104,0.65)';
  const cols = typed.length <= 12 ? 4 : 5;

  return (
    <div className="card" style={{ height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div className="card-title">Lotes Tipo {tipo}</div>
            <span className={`badge badge-${tipo.toLowerCase()}`}>{tipo}</span>
          </div>
          <div className="card-sub">
            {doneCount} de {typed.length} sorteados
          </div>
        </div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 28, fontWeight: 500, color: 'var(--gold2)' }}>
          {pct}%
        </div>
      </div>

      <div style={{ height: 6, background: 'var(--surface3)', borderRadius: 6, overflow: 'hidden', marginBottom: 14 }}>
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: tipo === 'A'
              ? 'linear-gradient(90deg, #3b82f6, #60a5fa)'
              : 'linear-gradient(90deg, var(--brand-navy), var(--brand-navy-light))',
            borderRadius: 6,
            transition: 'width 1s ease',
          }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 4 }}>
        {typed.map((l) => {
          const done = sorteadosSet.has(l.id);
          return (
            <div
              key={l.id}
              title={`Lote ${padLote(l.numero_lote)} — Tipo ${l.tipo}`}
              style={{
                height: 32,
                borderRadius: 4,
                background: done ? doneBg : 'var(--surface3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontFamily: "'DM Mono',monospace",
                color: done ? '#fff' : 'var(--text-dim)',
                transition: 'background 0.4s',
              }}
            >
              {l.numero_lote}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 14, marginTop: 12, fontSize: 11, color: 'var(--text-dim)' }}>
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
}

export default function DashboardPage({ lotes, items, resultados }) {
  const ganadores1 = resultados.filter((r) => r.posicion === 1);
  const sorteadosSet = new Set(ganadores1.map((r) => r.lote_id));
  const pendientes = lotes.length - sorteadosSet.size;
  const pct = lotes.length ? Math.round((sorteadosSet.size / lotes.length) * 100) : 0;

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

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div className="card-title">Progreso general del sorteo</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 24, fontWeight: 500, color: 'var(--gold2)' }}>
            {pct}%
          </div>
        </div>
        <div className="card-sub" style={{ marginBottom: 12 }}>
          {sorteadosSet.size} de {lotes.length} lotes con ganador principal
        </div>
        <div style={{ height: 8, background: 'var(--surface3)', borderRadius: 8, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${pct}%`,
              background: 'linear-gradient(90deg, var(--brand-navy), var(--brand-navy-light))',
              borderRadius: 8,
              transition: 'width 1s ease',
            }}
          />
        </div>
      </div>

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
