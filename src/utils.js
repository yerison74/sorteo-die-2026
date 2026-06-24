export const POSICION_LABELS = {
  1: 'Ganador Principal',
  2: 'Suplente 1',
  3: 'Suplente 2',
};

export const POSICION_COLORS = {
  1: '#1a3668',
  2: '#64748b',
  3: '#b45309',
};

export const POSICION_ICONS = {
  1: '👑',
  2: '🥈',
  3: '🥉',
};

/**
 * Código de tómbola por tipo: {SORTEO}-{A|B}-{000}
 * El número es el orden de registro dentro de esa tombola (no el id del lote).
 * sorteoNombre debe venir del sorteo activo real (ej: "DIE-2026-S02").
 */
export function generateCode(tipo, numero, sorteoNombre) {
  const t = String(tipo || '').toUpperCase();
  const padded = String(parseInt(numero, 10)).padStart(3, '0');
  const prefix = sorteoNombre || 'DIE-2026-S01';
  return `${prefix}-${t}-${padded}`;
}

export function fmt(n) {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 2,
  })
    .format(n)
    .replace('DOP', 'RD$');
}

export function padLote(n) {
  return String(n).padStart(2, '0');
}

/** Lote que muestra pantalla pública / QR: el elegido en Panel Operador */
export function resolveLoteEnVivo(lotes, loteActivoId, resultados) {
  // If operator explicitly selected a lote, always show that one
  if (loteActivoId != null && lotes?.length) {
    const picked = lotes.find((l) => l.id == loteActivoId);
    if (picked) return picked;
  }
  // loteActivoId is null — operator has not selected any lote
  // Fallback: show the LAST lote that has a Ganador Principal (posicion=1)
  // This prevents showing a lote that only has suplentes or was partially filled
  const conGanador = (lotes || [])
    .filter((l) => (resultados || []).some((r) => r.lote_id === l.id && r.posicion === 1))
    .sort((a, b) => a.numero_lote - b.numero_lote);
  return conGanador[conGanador.length - 1] || null;
}

/** URL absoluta de la página móvil (/info) codificada en el QR, con el sorteo activo */
export function getQrInfoUrl(sorteoId) {
  const base = (process.env.REACT_APP_PUBLIC_URL || '').trim().replace(/\/$/, '');
  let url;
  if (base) {
    url = base.endsWith('/info') ? base : `${base}/info`;
  } else if (typeof window !== 'undefined' && window.location?.origin) {
    url = `${window.location.origin}/info`;
  } else {
    url = '/info';
  }
  if (sorteoId != null) {
    url += `?sorteo=${sorteoId}`;
  }
  return url;
}

export function isLocalQrUrl(url) {
  try {
    const { hostname } = new URL(url);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
  } catch {
    return false;
  }
}
