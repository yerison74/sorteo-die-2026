export const POSICION_LABELS = {
  1: 'Ganador Principal',
  2: 'Suplente 1',
  3: 'Suplente 2',
};

export const POSICION_COLORS = {
  1: '#FFD700',
  2: '#C0C0C0',
  3: '#CD7F32',
};

export const POSICION_ICONS = {
  1: '👑',
  2: '🥈',
  3: '🥉',
};

export function generateCode(tipo, numero) {
  const padded = String(parseInt(numero, 10)).padStart(3, '0');
  return `DIE-2026-S01-${tipo}-${padded}`;
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
