import { padLote } from '../utils';

export function ProgresoGeneralSorteo({ lotes, sorteadosSet }) {
  const pct = lotes.length ? Math.round((sorteadosSet.size / lotes.length) * 100) : 0;

  return (
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
  );
}

export function LoteTipoPanel({ tipo, lotes, sorteadosSet, loteActivoId = null }) {
  const typed = lotes
    .filter((l) => (l.tipo || '').toUpperCase() === tipo)
    .sort((a, b) => a.numero_lote - b.numero_lote);
  const doneCount = typed.filter((l) => sorteadosSet.has(l.id)).length;
  const pct = typed.length ? Math.round((doneCount / typed.length) * 100) : 0;
  const doneBg = tipo === 'A' ? 'rgba(61,127,255,0.55)' : 'rgba(26,54,104,0.65)';
  const cols = typed.length <= 12 ? 4 : 5;

  return (
    <div className="card">
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
          const activo = loteActivoId != null && l.id == loteActivoId;
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
                transition: 'background 0.4s, box-shadow 0.2s',
                boxShadow: activo ? '0 0 0 2px var(--brand-navy), 0 0 0 4px rgba(26,54,104,0.15)' : 'none',
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
