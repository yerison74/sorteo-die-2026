import { QRCodeSVG } from 'qrcode.react';
import { fmt, padLote, POSICION_LABELS, POSICION_COLORS, POSICION_ICONS } from '../utils';

function GanadorPublicCard({ posicion, resultado }) {
  const c = POSICION_COLORS[posicion];
  return (
    <div style={{
      background: posicion === 1
        ? 'linear-gradient(135deg, #141008, #1c1a0a)'
        : 'var(--surface)',
      border: `1px solid ${c}45`,
      borderRadius: 14, padding: 22, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 14, right: 16, fontSize: 26, opacity: 0.35 }}>
        {POSICION_ICONS[posicion]}
      </div>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700, color: c, marginBottom: 10 }}>
        {POSICION_LABELS[posicion]}
      </div>
      {resultado ? (
        <>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: posicion === 1 ? 20 : 16, fontWeight: 700, color: 'var(--text)', lineHeight: 1.3, marginBottom: 5 }}>
            {resultado.nombre_oferente}
          </div>
          <div className="mono" style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>
            {resultado.codigo_oferente}
          </div>
          {resultado.rnc && (
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>RNC: {resultado.rnc}</div>
          )}
        </>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <div className="pulse" style={{ width: 8, height: 8, background: c, borderRadius: '50%' }} />
          <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>Esperando resultado…</span>
        </div>
      )}
    </div>
  );
}

export default function PublicScreen({ lotes, items, resultados }) {
  const lotesConResultado = lotes
    .filter(l => resultados.some(r => r.lote_id === l.id))
    .sort((a, b) => a.numero_lote - b.numero_lote);

  const currentLote = lotesConResultado[lotesConResultado.length - 1] || null;
  const historial   = [...lotesConResultado].reverse().slice(0, 12);

  const getLoteRes   = (l) => resultados.filter(r => r.lote_id === l.id).sort((a, b) => a.posicion - b.posicion);
  const getLoteItems = (l) => items.filter(it => it.lote_id === l.id);

  // URL that the QR will point to — the /info mobile page
  const qrUrl = `${window.location.origin}/info`;

  if (!currentLote) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)', flexDirection: 'column', gap: 18 }}>
        <div style={{ fontSize: 72 }} className="pulse">⚖️</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 32, color: 'var(--gold2)', textAlign: 'center' }}>
          Sorteo DIE-2026-S01
        </div>
        <div style={{ color: 'var(--text-dim)', fontSize: 13, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          En espera de resultados…
        </div>
        {/* QR shown even on waiting screen */}
        <QRCard qrUrl={qrUrl} />
      </div>
    );
  }

  const currentRes   = getLoteRes(currentLote);
  const currentItems = getLoteItems(currentLote);

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20,
      padding: 24, maxWidth: 1400, margin: '0 auto',
    }}>
      {/* ── MAIN ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Lote header */}
        <div style={{
          background: 'linear-gradient(135deg, #0e1318 0%, #141a22 100%)',
          border: '1px solid rgba(201,168,76,0.22)',
          borderRadius: 18, padding: 28, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -80, right: -80,
            width: 240, height: 240, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6 }}>
                Lote Actual
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
                <div style={{
                  fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: 72,
                  background: 'linear-gradient(135deg, var(--gold), var(--gold2))',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1,
                }}>
                  {padLote(currentLote.numero_lote)}
                </div>
                <span className={`badge badge-${currentLote.tipo.toLowerCase()}`} style={{ fontSize: 15, padding: '4px 14px' }}>
                  Tipo {currentLote.tipo}
                </span>
              </div>
              <div className="mono" style={{ fontSize: 24, fontWeight: 500, color: 'var(--gold2)', marginTop: 10 }}>
                {fmt(currentLote.monto_lote)}
              </div>
            </div>
            <div style={{ textAlign: 'right', opacity: 0.5 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 28, color: 'var(--gold)' }}>S01</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>DIE · 2026</div>
            </div>
          </div>
        </div>

        {/* Ganadores */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 14 }}>
          {[1, 2, 3].map(pos => (
            <GanadorPublicCard
              key={pos}
              posicion={pos}
              resultado={currentRes.find(r => r.posicion === pos)}
            />
          ))}
        </div>

        {/* Centros educativos */}
        <div className="card">
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>
            Centros Educativos Incluidos ({currentItems.length})
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 10 }}>
            {currentItems.map((it, i) => (
              <div key={i} style={{
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 8, padding: 12,
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, lineHeight: 1.3 }}>
                  {it.nombre_centro_educativo}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>📍 {it.provincia}</div>
                <div className="mono" style={{ fontSize: 12, color: 'var(--gold)', marginTop: 6 }}>
                  {fmt(it.monto_obra)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SIDEBAR ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* QR Card */}
        <QRCard qrUrl={qrUrl} />

        {/* History */}
        <div className="card" style={{ position: 'sticky', top: 88 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-dim)', marginBottom: 16 }}>
            Últimos Adjudicados
          </div>
          {historial.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Sin resultados aún</div>
          )}
          {historial.map(l => {
            const g1 = resultados.find(r => r.lote_id === l.id && r.posicion === 1);
            return (
              <div key={l.id} className="fade-in" style={{
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 8, padding: 12, marginBottom: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                    Lote {padLote(l.numero_lote)}
                  </span>
                  <span className={`badge badge-${l.tipo.toLowerCase()}`} style={{ fontSize: 9, padding: '1px 5px' }}>{l.tipo}</span>
                </div>
                {g1 && (
                  <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.3, color: 'var(--text)' }}>
                    👑 {g1.nombre_oferente}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── QR Card component ────────────────────────────────────────────────────
function QRCard({ qrUrl }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #0e1318, #141c24)',
      border: '1px solid rgba(201,168,76,0.3)',
      borderRadius: 14, padding: 20,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--gold)' }}>
        📱 Seguimiento en vivo
      </div>

      {/* QR with gold border frame */}
      <div style={{
        padding: 10,
        background: '#fff',
        borderRadius: 10,
        boxShadow: '0 0 0 2px var(--gold), 0 0 24px rgba(201,168,76,0.2)',
      }}>
        <QRCodeSVG
          value={qrUrl}
          size={160}
          bgColor="#ffffff"
          fgColor="#07080d"
          level="M"
          includeMargin={false}
        />
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
          Escanea para ver resultados
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5 }}>
          Dashboard · Ganadores<br />Actualización en tiempo real
        </div>
      </div>

      <div style={{
        fontFamily: "'DM Mono',monospace", fontSize: 10,
        color: 'var(--text-dim)', wordBreak: 'break-all', textAlign: 'center',
        background: 'var(--surface3)', padding: '4px 8px', borderRadius: 4,
        width: '100%',
      }}>
        {qrUrl}
      </div>
    </div>
  );
}
