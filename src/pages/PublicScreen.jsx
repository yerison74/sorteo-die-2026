import { QRCodeSVG } from 'qrcode.react';
import SyncStatus from '../components/SyncStatus';
import {
  fmt, padLote, POSICION_LABELS, POSICION_COLORS, POSICION_ICONS,
  getQrInfoUrl, isLocalQrUrl, resolveLoteEnVivo,
} from '../utils';

function GanadorPublicCard({ posicion, resultado }) {
  const c = POSICION_COLORS[posicion];
  return (
    <div style={{
      background: posicion === 1
        ? 'linear-gradient(135deg, #eef4fc, #ffffff)'
        : 'var(--surface)',
      border: `1px solid ${c}45`,
      borderRadius: 14, padding: 22, position: 'relative', overflow: 'hidden',
      boxShadow: 'var(--shadow-md)',
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

export default function PublicScreen({ lotes, items, resultados, loteActivo, lastSyncAt, syncing, estadoLoaded }) {
  // Lotes que tienen AL MENOS UN resultado registrado
  const lotesConResultado = lotes
    .filter(l => resultados.some(r => r.lote_id === l.id))
    .sort((a, b) => a.numero_lote - b.numero_lote);

  // El lote activo puede estar seleccionado en el operador pero sin resultados aún —
  // lo mostramos igual (con "Esperando…"). Si se eliminaron TODOS sus resultados
  // y no hay otro lote con resultados, mostramos pantalla de espera.
  // loteActivo is already null until estadoLoaded (handled in useAppData hook)
  // resolveLoteEnVivo fallback only used when no lote is selected by operator
  // Both loteActivo and fallback are blocked until estadoLoaded (loteActivo=null from hook)
  const currentLote = loteActivo; // resolveLoteEnVivo fallback removed: hook handles it

  // Historial: solo lotes con Ganador Principal registrado (posicion === 1)
  const historial = lotes
    .filter(l => resultados.some(r => r.lote_id === l.id && r.posicion === 1))
    .sort((a, b) => b.numero_lote - a.numero_lote)
    .slice(0, 12);

  const getLoteRes   = (l) => resultados.filter(r => r.lote_id === l.id).sort((a, b) => a.posicion - b.posicion);
  const getLoteItems = (l) => items.filter(it => it.lote_id === l.id);

  const qrUrl = getQrInfoUrl();
  const qrLocalOnly = isLocalQrUrl(qrUrl);

  // Don't render anything until we've confirmed the state from Supabase
  // This prevents a flash of a stale lote from localStorage on reload
  if (!currentLote) {
    return (
      <div className="public-waiting">
        <img src="/logoDie.png" alt="DIE" className="brand-logo-xl" />
        <div className="public-waiting-title">Sorteo DIE-2026-S01</div>
        <div className="public-waiting-sub">En espera de resultados…</div>
        <SyncStatus lastSyncAt={lastSyncAt} syncing={syncing} />
        <QRCard qrUrl={qrUrl} large localOnly={qrLocalOnly} />
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
      <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
        <SyncStatus lastSyncAt={lastSyncAt} syncing={syncing} />
      </div>
      {/* ── MAIN ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Lote header */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border2)',
          borderRadius: 18, padding: 28, position: 'relative', overflow: 'hidden',
          boxShadow: 'var(--shadow-lg)',
        }}>
          <div style={{
            position: 'absolute', top: -80, right: -80,
            width: 240, height: 240, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(26,54,104,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6 }}>
                Lote en curso · Seleccionado en operador
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
        <QRCard qrUrl={qrUrl} localOnly={qrLocalOnly} />

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
function QRCard({ qrUrl, large = false, localOnly = false }) {
  const qrSize = large ? 280 : 180;
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: large ? 20 : 14,
      padding: large ? '36px 40px' : 22,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: large ? 22 : 14,
      boxShadow: 'var(--shadow-lg)',
      width: large ? 'min(100%, 480px)' : '100%',
    }}>
      <div style={{
        fontSize: large ? 15 : 11,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.15em',
        color: 'var(--brand-navy)',
      }}>
        📱 Seguimiento en vivo
      </div>

      <div style={{
        padding: large ? 16 : 10,
        background: '#fff',
        borderRadius: large ? 14 : 10,
        boxShadow: '0 0 0 2px var(--brand-navy-light), 0 8px 28px rgba(26,54,104,0.2)',
      }}>
        <QRCodeSVG
          value={qrUrl}
          size={qrSize}
          bgColor="#ffffff"
          fgColor="#1a3668"
          level="H"
          includeMargin
        />
      </div>

      {localOnly && (
        <div className="alert alert-warn" style={{ width: '100%', fontSize: large ? 13 : 12, lineHeight: 1.5 }}>
          El QR apunta a <strong>localhost</strong>: el celular no puede abrirlo. En <code>.env</code> agregue{' '}
          <code>REACT_APP_PUBLIC_URL=https://su-dominio.vercel.app</code> y reinicie <code>npm start</code>.
        </div>
      )}

      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: large ? 20 : 14,
          fontWeight: 600,
          color: 'var(--text)',
          marginBottom: large ? 8 : 4,
        }}>
          Escanea para ver resultados
        </div>
        <div style={{
          fontSize: large ? 15 : 12,
          color: 'var(--text-dim)',
          lineHeight: 1.6,
        }}>
          Dashboard · Ganadores<br />Actualización en tiempo real
        </div>
      </div>

      <a
        href={qrUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontFamily: "'DM Mono',monospace",
          fontSize: large ? 12 : 10,
          color: 'var(--brand-navy)',
          wordBreak: 'break-all',
          textAlign: 'center',
          background: 'var(--surface3)',
          padding: large ? '10px 14px' : '6px 10px',
          borderRadius: 8,
          width: '100%',
          textDecoration: 'none',
          display: 'block',
        }}
      >
        {qrUrl}
      </a>
    </div>
  );
}
