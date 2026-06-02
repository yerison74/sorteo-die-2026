const CHANNEL_NAME = 'sorteo-die-2026-sync';
export const LOTE_ACTIVO_STORAGE_KEY = 'sorteo-die-lote-activo-id';

function postMessage(msg) {
  if (typeof BroadcastChannel === 'undefined') return;
  try {
    const ch = new BroadcastChannel(CHANNEL_NAME);
    ch.postMessage(msg);
    ch.close();
  } catch {
    /* ignore */
  }
}

/** Aviso entre pestañas del mismo navegador (proyector + operador en un PC) */
export function broadcastSorteoUpdate() {
  postMessage({ type: 'refresh', at: Date.now() });
}

/** Lote seleccionado en Panel Operador → Público + QR */
export function broadcastLoteActivo(loteId) {
  postMessage({ type: 'lote-activo', loteId: loteId ?? null, at: Date.now() });
}

export function subscribeSorteoUpdates({ onRefresh, onLoteActivo } = {}) {
  if (typeof BroadcastChannel === 'undefined') return () => {};
  const ch = new BroadcastChannel(CHANNEL_NAME);
  ch.onmessage = (ev) => {
    if (ev?.data?.type === 'lote-activo') onLoteActivo?.(ev.data.loteId);
    if (ev?.data?.type === 'refresh') onRefresh?.();
  };
  return () => ch.close();
}
