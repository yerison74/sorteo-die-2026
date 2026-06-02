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
 * Código de tómbola por tipo: DIE-2026-S01-{A|B}-{000}
 * El número es el orden de registro dentro de esa tombola (no el id del lote).
 */
export function generateCode(tipo, numero) {
  const t = String(tipo || '').toUpperCase();
  const padded = String(parseInt(numero, 10)).padStart(3, '0');
  return `DIE-2026-S01-${t}-${padded}`;
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
  if (loteActivoId != null && lotes?.length) {
    const picked = lotes.find((l) => l.id == loteActivoId);
    if (picked) return picked;
  }
  const conRes = (lotes || [])
    .filter((l) => (resultados || []).some((r) => r.lote_id === l.id))
    .sort((a, b) => a.numero_lote - b.numero_lote);
  return conRes[conRes.length - 1] || null;
}

/** URL absoluta de la página móvil (/info) codificada en el QR */
export function getQrInfoUrl() {
  const base = (process.env.REACT_APP_PUBLIC_URL || '').trim().replace(/\/$/, '');
  if (base) {
    return base.endsWith('/info') ? base : `${base}/info`;
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/info`;
  }
  return '/info';
}

export function isLocalQrUrl(url) {
  try {
    const { hostname } = new URL(url);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
  } catch {
    return false;
  }
}
