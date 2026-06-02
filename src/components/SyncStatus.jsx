/** Indicador de sincronización en vivo (QR, pantalla pública, topbar) */
export default function SyncStatus({ lastSyncAt, syncing, compact = false }) {
  const time = lastSyncAt
    ? lastSyncAt.toLocaleTimeString('es-DO', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : null;

  return (
    <span
      className={`sync-status${syncing ? ' syncing' : ''}${compact ? ' sync-status-compact' : ''}`}
      title="Los datos se actualizan al registrar en Panel Operador"
    >
      <span className="sync-status-dot" aria-hidden />
      {syncing ? 'Actualizando…' : time ? `En vivo · ${time}` : 'En vivo'}
    </span>
  );
}
