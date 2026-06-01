import { generateCode, padLote } from '../utils';

const CODE_PREFIX = 'DIE-2026-S01';

/** Parsea DIE-2026-S01-{A|B}-{000} */
export function parseOferenteCode(codigo) {
  if (!codigo) return null;
  const m = String(codigo).trim().match(/^DIE-2026-S01-([AB])-(\d{3})$/i);
  if (!m) return null;
  return { tipo: m[1].toUpperCase(), numero: m[2], codigo: generateCode(m[1], m[2]) };
}

/** Identidad estable entre filas A/B del mismo oferente (RNC > RPE > id) */
export function oferenteIdentity(o) {
  const rnc = (o?.rnc || '').trim();
  const rpe = (o?.rpe || '').trim();
  if (rnc) return `rnc:${rnc}`;
  if (rpe) return `rpe:${rpe}`;
  return `id:${o?.id}`;
}

export function sameOferente(a, b) {
  if (!a || !b) return false;
  if (a.id != null && b.id != null && a.id === b.id) return true;
  return oferenteIdentity(a) === oferenteIdentity(b);
}

/** Ganador principal previo del mismo oferente (cualquier lote / posición) */
export function findPrincipalWin(oferente, resultados, lotes, oferentes = []) {
  const principal = resultados.filter(r => r.posicion === 1);
  for (const r of principal) {
    if (r.oferente_id === oferente.id) {
      return { resultado: r, lote: lotes.find(l => l.id === r.lote_id) };
    }
    const row = oferentes.find(o => o.id === r.oferente_id);
    if (row && sameOferente(row, oferente)) {
      return { resultado: r, lote: lotes.find(l => l.id === r.lote_id) };
    }
    if (
      (r.rnc && oferente.rnc && r.rnc.trim() === oferente.rnc.trim()) ||
      (r.rpe && oferente.rpe && r.rpe.trim() === oferente.rpe.trim())
    ) {
      return { resultado: r, lote: lotes.find(l => l.id === r.lote_id) };
    }
  }
  return null;
}

export function formatPrincipalWinMessage(oferente, lote) {
  const nombre = oferente?.nombre_oferente || 'desconocido';
  const num = lote?.numero_lote != null ? padLote(lote.numero_lote) : '—';
  const tipo = (lote?.tipo || '').toUpperCase();
  return `El oferente ${nombre} ya gano en el lote ${num} de la tombola ${tipo}.`;
}

/** No puede participar si ya fue ganador principal (en ninguna posición del sorteo) */
export function canRegisterOferente(oferente, resultados, lotes, oferentes = []) {
  const prev = findPrincipalWin(oferente, resultados, lotes, oferentes);
  if (prev) {
    return { ok: false, message: formatPrincipalWinMessage(oferente, prev.lote) };
  }
  return { ok: true };
}

/** El código buscado debe corresponder al tipo de lote seleccionado */
export function validateCodeForLoteTipo(codigo, loteTipo) {
  const parsed = parseOferenteCode(codigo);
  const tipo = (loteTipo || '').toUpperCase();
  if (!parsed) {
    return { ok: false, message: `Código inválido. Use el formato ${CODE_PREFIX}-${tipo}-000` };
  }
  if (parsed.tipo !== tipo) {
    return {
      ok: false,
      message: `Este número pertenece a la tombola ${parsed.tipo} (${parsed.codigo}). El lote actual es tipo ${tipo}.`,
    };
  }
  return { ok: true, parsed };
}

export function buildCodigoFromTombola(tipo, numeroInput) {
  const n = parseInt(String(numeroInput).trim(), 10);
  if (!Number.isFinite(n) || n < 1 || n > 999) return null;
  return generateCode((tipo || 'A').toUpperCase(), n);
}
