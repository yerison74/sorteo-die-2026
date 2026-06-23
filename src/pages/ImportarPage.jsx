import { useState, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { fmt, padLote } from '../utils';
import { SectionHeader } from '../components/UI';

const PAGE_SIZE = 10;

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function parseMonto(val) {
  if (val === null || val === undefined || val === '') return null;
  const s = String(val).replace(/[^0-9.,]/g, '').replace(',', '.');
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

function Badge({ children, color = '#64748b' }) {
  return (
    <span style={{
      background: color + '18', color, border: `1px solid ${color}35`,
      padding: '2px 8px', borderRadius: 4,
      fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
    }}>{children}</span>
  );
}

function Pagination({ page, total, pageSize, onChange }) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, gap: 8 }}>
      <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
        {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} de {total} registros
      </span>
      <div style={{ display: 'flex', gap: 4 }}>
        <button
          onClick={() => onChange(page - 1)} disabled={page === 1}
          style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface2)', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1, fontSize: 13 }}
        >‹ Ant</button>
        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
          let p;
          if (totalPages <= 7) p = i + 1;
          else if (page <= 4) p = i + 1;
          else if (page >= totalPages - 3) p = totalPages - 6 + i;
          else p = page - 3 + i;
          return (
            <button key={p} onClick={() => onChange(p)}
              style={{
                padding: '4px 10px', borderRadius: 6, fontSize: 13,
                border: `1px solid ${p === page ? 'var(--accent)' : 'var(--border)'}`,
                background: p === page ? 'var(--accent)' : 'var(--surface2)',
                color: p === page ? '#fff' : 'var(--text)', cursor: 'pointer',
              }}
            >{p}</button>
          );
        })}
        <button
          onClick={() => onChange(page + 1)} disabled={page === totalPages}
          style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface2)', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1, fontSize: 13 }}
        >Sig ›</button>
      </div>
    </div>
  );
}

/* ─── Drop Zone ──────────────────────────────────────────────────────────── */
function DropZone({ onFile, accept = '.xlsx,.xls', label }) {
  const [drag, setDrag] = useState(false);
  const ref = useRef();
  const handle = (file) => { if (file) onFile(file); };
  return (
    <div
      onClick={() => ref.current.click()}
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files[0]); }}
      style={{
        border: `2px dashed ${drag ? 'var(--accent)' : 'rgba(201,168,76,0.4)'}`,
        borderRadius: 12, padding: '28px 20px', textAlign: 'center', cursor: 'pointer',
        background: drag ? 'rgba(26,54,104,0.06)' : 'rgba(201,168,76,0.03)',
        transition: 'all 0.2s',
      }}
    >
      <input ref={ref} type="file" accept={accept} style={{ display: 'none' }}
        onChange={e => handle(e.target.files[0])} />
      <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
        Arrastra un archivo Excel o haz clic para seleccionar
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>.xlsx · .xls</div>
    </div>
  );
}

/* ─── Tabla previa de Lotes ──────────────────────────────────────────────── */
function LotesPreview({ rows, page, onPageChange }) {
  const slice = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <table className="table" style={{ fontSize: 12, minWidth: 700 }}>
          <thead>
            <tr>
              <th style={{ width: 40 }}>#</th>
              <th>N° Lote</th>
              <th>Tipo</th>
              <th>Monto Lote</th>
              <th>N° Ítem</th>
              <th>Centro Educativo</th>
              <th>Provincia</th>
              <th>Monto Obra</th>
              <th style={{ width: 50 }}>Est.</th>
            </tr>
          </thead>
          <tbody>
            {slice.map((r, i) => (
              <tr key={i} style={{ background: r._error ? 'rgba(224,80,80,0.05)' : undefined }}>
                <td style={{ color: 'var(--text-dim)' }}>{(page - 1) * PAGE_SIZE + i + 1}</td>
                <td className="mono" style={{ fontWeight: 600 }}>
                  {r.numero_lote != null ? padLote(r.numero_lote) : <span style={{ color: 'var(--red)' }}>—</span>}
                </td>
                <td>
                  {r.tipo
                    ? <Badge color={r.tipo === 'A' ? '#3d7fff' : '#1a3668'}>{r.tipo}</Badge>
                    : <span style={{ color: 'var(--red)', fontSize: 11 }}>Sin tipo</span>}
                </td>
                <td className="mono">{r.monto_lote != null ? fmt(r.monto_lote) : <span style={{ color: 'var(--red)' }}>—</span>}</td>
                <td className="mono">{r.numero_item ?? '—'}</td>
                <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.nombre_centro_educativo || <span style={{ color: 'var(--text-dim)' }}>—</span>}
                </td>
                <td style={{ color: 'var(--text-dim)' }}>{r.provincia || '—'}</td>
                <td className="mono">{r.monto_obra != null ? fmt(r.monto_obra) : '—'}</td>
                <td style={{ textAlign: 'center' }}>
                  {r._error
                    ? <span title={r._error} style={{ cursor: 'help' }}>⚠️</span>
                    : <span style={{ color: '#16a34a' }}>✓</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} total={rows.length} pageSize={PAGE_SIZE} onChange={onPageChange} />
    </div>
  );
}

/* ─── Tabla previa de Oferentes ─────────────────────────────────────────── */
function OferentesPreview({ rows, page, onPageChange }) {
  const slice = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <table className="table" style={{ fontSize: 12, minWidth: 700 }}>
          <thead>
            <tr>
              <th style={{ width: 40 }}>#</th>
              <th>Código</th>
              <th>Nombre Oferente</th>
              <th>RNC</th>
              <th>RPE</th>
              <th>Lotes Habilitados</th>
              <th style={{ width: 50 }}>Est.</th>
            </tr>
          </thead>
          <tbody>
            {slice.map((r, i) => (
              <tr key={i} style={{ background: r._error ? 'rgba(224,80,80,0.05)' : undefined }}>
                <td style={{ color: 'var(--text-dim)' }}>{(page - 1) * PAGE_SIZE + i + 1}</td>
                <td className="mono" style={{ fontWeight: 600 }}>
                  {r.codigo || <span style={{ color: 'var(--red)' }}>—</span>}
                </td>
                <td style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                  {r.nombre_oferente || <span style={{ color: 'var(--red)' }}>—</span>}
                </td>
                <td className="mono">{r.rnc || '—'}</td>
                <td className="mono">{r.rpe || '—'}</td>
                <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-dim)', fontSize: 11 }}>
                  {r.lote_habilitado || '—'}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {r._error
                    ? <span title={r._error} style={{ cursor: 'help' }}>⚠️</span>
                    : <span style={{ color: '#16a34a' }}>✓</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} total={rows.length} pageSize={PAGE_SIZE} onChange={onPageChange} />
    </div>
  );
}

/* ─── Template downloaders ──────────────────────────────────────────────── */
function downloadTemplate(type) {
  const XLSX = window.XLSX;
  if (!XLSX) { alert('Librería Excel no disponible. Recarga la página.'); return; }

  let ws, filename;
  if (type === 'lotes') {
    const data = [
      ['numero_lote', 'tipo', 'monto_lote', 'numero_item', 'nombre_centro_educativo', 'provincia', 'monto_obra'],
      [1, 'A', 5000000, 1, 'Escuela Básica Juan Pablo Duarte', 'Distrito Nacional', 250000],
      [1, 'A', 5000000, 2, 'Escuela Básica Salomé Ureña', 'Santo Domingo', 180000],
      [2, 'B', 8000000, 1, 'Liceo Científico Dr. Miguel Canela Lázaro', 'Santiago', 400000],
    ];
    ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 12 }, { wch: 6 }, { wch: 14 }, { wch: 10 }, { wch: 45 }, { wch: 22 }, { wch: 14 }];
    filename = 'Plantilla_Lotes.xlsx';
  } else {
    const data = [
      ['codigo', 'nombre_oferente', 'rnc', 'rpe', 'lote_habilitado'],
      ['DIE-2026-S02-A-001', 'Constructora ABC, S.R.L.', '101234567', 'RPE-001', 'A-001,A-002,B-001'],
      ['DIE-2026-S02-B-001', 'Empresa Constructora XYZ, S.A.', '209876543', 'RPE-002', 'B-001,B-002'],
    ];
    ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 22 }, { wch: 42 }, { wch: 14 }, { wch: 12 }, { wch: 28 }];
    filename = 'Plantilla_Oferentes.xlsx';
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, type === 'lotes' ? 'Lotes' : 'Oferentes');
  XLSX.writeFile(wb, filename);
}

/* ─── Parser de Excel ───────────────────────────────────────────────────── */
function parseExcel(file, type) {
  return new Promise((resolve, reject) => {
    const XLSX = window.XLSX;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { defval: '' });
        if (raw.length === 0) { resolve([]); return; }

        let rows;
        if (type === 'lotes') {
          rows = raw.map((r, idx) => {
            const numero_lote  = parseInt(r['numero_lote']  ?? r['Numero Lote']  ?? r['N° Lote'] ?? '', 10);
            const tipo         = String(r['tipo'] ?? r['Tipo'] ?? '').toUpperCase().trim();
            const monto_lote   = parseMonto(r['monto_lote']  ?? r['Monto Lote']  ?? r['Monto']);
            const numero_item  = parseInt(r['numero_item']  ?? r['Numero Item']  ?? r['N° Item'] ?? '', 10);
            const nombre_ce    = String(r['nombre_centro_educativo'] ?? r['Centro Educativo'] ?? r['Centro'] ?? '').trim();
            const provincia    = String(r['provincia'] ?? r['Provincia'] ?? '').trim();
            const monto_obra   = parseMonto(r['monto_obra'] ?? r['Monto Obra'] ?? '');

            const errors = [];
            if (isNaN(numero_lote))         errors.push('numero_lote inválido');
            if (!['A', 'B'].includes(tipo)) errors.push('tipo debe ser A o B');
            if (monto_lote === null)         errors.push('monto_lote inválido');

            return {
              numero_lote: isNaN(numero_lote) ? null : numero_lote,
              tipo: ['A','B'].includes(tipo) ? tipo : null,
              monto_lote,
              numero_item: isNaN(numero_item) ? null : numero_item,
              nombre_centro_educativo: nombre_ce || null,
              provincia: provincia || null,
              monto_obra,
              _error: errors.length ? errors.join(', ') : null,
              _row: idx + 2,
            };
          });
        } else {
          rows = raw.map((r, idx) => {
            const codigo          = String(r['codigo'] ?? r['Código'] ?? r['Codigo'] ?? '').trim();
            const nombre_oferente = String(r['nombre_oferente'] ?? r['Nombre Oferente'] ?? r['Nombre'] ?? '').trim();
            const rnc             = String(r['rnc'] ?? r['RNC'] ?? '').trim();
            const rpe             = String(r['rpe'] ?? r['RPE'] ?? '').trim();
            const lote_habilitado = String(r['lote_habilitado'] ?? r['Lotes Habilitados'] ?? r['Lotes'] ?? '').trim();

            const errors = [];
            if (!codigo)          errors.push('código vacío');
            if (!nombre_oferente) errors.push('nombre vacío');

            return {
              codigo: codigo || null,
              nombre_oferente: nombre_oferente || null,
              rnc: rnc || null,
              rpe: rpe || null,
              lote_habilitado: lote_habilitado || null,
              _error: errors.length ? errors.join(', ') : null,
              _row: idx + 2,
            };
          });
        }
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsArrayBuffer(file);
  });
}

/* ─── Panel de importación de Lotes ─────────────────────────────────────── */
function ImportarLotes({ sorteoId, sorteoNombre, onDone }) {
  const [rows,     setRows]     = useState(null);   // parsed preview rows
  const [page,     setPage]     = useState(1);
  const [fileName, setFileName] = useState('');
  const [parsing,  setParsing]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [progress, setProgress] = useState('');
  const [result,   setResult]   = useState(null);  // { ok, errors }
  const [parseErr, setParseErr] = useState('');

  const errorRows  = rows ? rows.filter(r => r._error) : [];
  const validRows  = rows ? rows.filter(r => !r._error) : [];

  const handleFile = useCallback(async (file) => {
    setFileName(file.name);
    setParsing(true);
    setParseErr('');
    setRows(null);
    setResult(null);
    setPage(1);
    try {
      const parsed = await parseExcel(file, 'lotes');
      setRows(parsed);
    } catch (e) {
      setParseErr(e.message || 'Error al leer el archivo.');
    }
    setParsing(false);
  }, []);

  const handleImport = async () => {
    if (!rows || validRows.length === 0) return;
    setSaving(true);
    setResult(null);
    setProgress('Preparando lotes…');

    // Group rows by lote number to build lotes + items
    const loteMap = new Map();
    for (const r of validRows) {
      const key = `${r.numero_lote}-${r.tipo}`;
      if (!loteMap.has(key)) {
        loteMap.set(key, { numero_lote: r.numero_lote, tipo: r.tipo, monto_lote: r.monto_lote, items: [] });
      }
      if (r.nombre_centro_educativo) {
        loteMap.get(key).items.push({
          numero_item:             r.numero_item,
          nombre_centro_educativo: r.nombre_centro_educativo,
          provincia:               r.provincia,
          monto_obra:              r.monto_obra,
        });
      }
    }

    const loteList = Array.from(loteMap.values());
    const errors = [];
    let insertedLotes = 0, insertedItems = 0;

    for (const lote of loteList) {
      setProgress(`Insertando lote #${padLote(lote.numero_lote)}…`);
      const { data: newLote, error: loteErr } = await supabase
        .from('lotes')
        .insert({ numero_lote: lote.numero_lote, tipo: lote.tipo, monto_lote: lote.monto_lote, sorteo_id: sorteoId })
        .select()
        .single();

      if (loteErr) {
        errors.push(`Lote #${padLote(lote.numero_lote)}: ${loteErr.message}`);
        continue;
      }
      insertedLotes++;

      if (lote.items.length > 0) {
        const itemRows = lote.items.map(it => ({ ...it, lote_id: newLote.id, sorteo_id: sorteoId }));
        const { error: itemErr } = await supabase.from('items_lote').insert(itemRows);
        if (itemErr) {
          errors.push(`Ítems del lote #${padLote(lote.numero_lote)}: ${itemErr.message}`);
        } else {
          insertedItems += itemRows.length;
        }
      }
    }

    setSaving(false);
    setProgress('');
    setResult({ ok: insertedLotes, items: insertedItems, errors });
  };

  const reset = () => { setRows(null); setFileName(''); setResult(null); setParseErr(''); setPage(1); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Plantilla */}
      <div style={{
        background: 'rgba(26,54,104,0.05)', border: '1px solid rgba(26,54,104,0.15)',
        borderRadius: 10, padding: '14px 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>📋 Plantilla Excel</div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
            Columnas: <span className="mono" style={{ fontSize: 11 }}>numero_lote · tipo · monto_lote · numero_item · nombre_centro_educativo · provincia · monto_obra</span>
          </div>
        </div>
        <button onClick={() => downloadTemplate('lotes')}
          style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(26,54,104,0.3)', background: 'var(--surface)', color: 'var(--accent)', fontWeight: 600, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          ⬇️ Descargar plantilla
        </button>
      </div>

      {/* Drop zone */}
      {!rows && !parsing && (
        <DropZone onFile={handleFile} label="Seleccionar archivo de Lotes (.xlsx)" />
      )}

      {/* Parsing */}
      {parsing && (
        <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-dim)' }}>
          <div className="spin" style={{ width: 28, height: 28, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', display: 'inline-block', marginBottom: 10 }} />
          <div style={{ fontSize: 13 }}>Leyendo {fileName}…</div>
        </div>
      )}

      {parseErr && (
        <div style={{ background: 'rgba(224,80,80,0.08)', border: '1px solid rgba(224,80,80,0.25)', borderRadius: 8, padding: 14, color: 'var(--red)', fontSize: 13 }}>
          ⚠️ {parseErr} <button onClick={reset} style={{ marginLeft: 10, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: 12 }}>Reintentar</button>
        </div>
      )}

      {/* Preview */}
      {rows && !result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Resumen */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontWeight: 600, fontSize: 14, flex: 1 }}>📄 {fileName}</div>
            <Badge color="#16a34a">{validRows.length} válidos</Badge>
            {errorRows.length > 0 && <Badge color="#dc2626">{errorRows.length} con error</Badge>}
            <button onClick={reset} style={{ fontSize: 12, color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Cambiar archivo</button>
          </div>

          {/* Errores */}
          {errorRows.length > 0 && (
            <div style={{ background: 'rgba(224,80,80,0.06)', border: '1px solid rgba(224,80,80,0.2)', borderRadius: 8, padding: '10px 14px' }}>
              <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--red)', marginBottom: 6 }}>⚠️ Filas con error — no se importarán:</div>
              {errorRows.map(r => (
                <div key={r._row} style={{ fontSize: 11, color: 'var(--red)', fontFamily: "'DM Mono',monospace" }}>
                  Fila {r._row}: {r._error}
                </div>
              ))}
            </div>
          )}

          {/* Tabla */}
          <LotesPreview rows={rows} page={page} onPageChange={setPage} />

          {/* Botón importar */}
          {validRows.length > 0 && (
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={reset} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 14, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={handleImport} disabled={saving}
                style={{ padding: '10px 24px', borderRadius: 8, background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: saving ? 0.75 : 1 }}>
                {saving
                  ? <><span className="spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block' }} /> {progress}</>
                  : `✅ Importar ${validRows.length} filas al sorteo ${sorteoNombre}`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Resultado */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: result.ok > 0 ? 'rgba(22,163,74,0.06)' : 'rgba(224,80,80,0.06)', border: `1px solid ${result.ok > 0 ? 'rgba(22,163,74,0.25)' : 'rgba(224,80,80,0.25)'}`, borderRadius: 10, padding: '18px 22px' }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>
              {result.ok > 0 ? '✅' : '❌'} Importación {result.errors.length === 0 ? 'completada' : 'parcial'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.8 }}>
              • <strong>{result.ok}</strong> lote(s) insertado(s)<br />
              • <strong>{result.items}</strong> ítem(s) insertado(s)
            </div>
            {result.errors.length > 0 && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                {result.errors.map((e, i) => (
                  <div key={i} style={{ fontSize: 12, color: 'var(--red)', fontFamily: "'DM Mono',monospace" }}>{e}</div>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={reset} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 14, cursor: 'pointer' }}>
              Nueva importación
            </button>
            {onDone && <button onClick={onDone} style={{ padding: '10px 20px', borderRadius: 8, background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
              Ir al Panel Operador →
            </button>}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Panel de importación de Oferentes ─────────────────────────────────── */
function ImportarOferentes({ sorteoId, sorteoNombre, onDone }) {
  const [rows,     setRows]     = useState(null);
  const [page,     setPage]     = useState(1);
  const [fileName, setFileName] = useState('');
  const [parsing,  setParsing]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [progress, setProgress] = useState('');
  const [result,   setResult]   = useState(null);
  const [parseErr, setParseErr] = useState('');

  const errorRows = rows ? rows.filter(r => r._error) : [];
  const validRows = rows ? rows.filter(r => !r._error) : [];

  const handleFile = useCallback(async (file) => {
    setFileName(file.name);
    setParsing(true);
    setParseErr('');
    setRows(null);
    setResult(null);
    setPage(1);
    try {
      const parsed = await parseExcel(file, 'oferentes');
      setRows(parsed);
    } catch (e) {
      setParseErr(e.message || 'Error al leer el archivo.');
    }
    setParsing(false);
  }, []);

  const handleImport = async () => {
    if (!rows || validRows.length === 0) return;
    setSaving(true);
    setProgress('Insertando oferentes…');

    const toInsert = validRows.map(r => ({
      codigo:           r.codigo,
      nombre_oferente:  r.nombre_oferente,
      rnc:              r.rnc,
      rpe:              r.rpe,
      lote_habilitado:  r.lote_habilitado,
      sorteo_id:        sorteoId,
    }));

    // Insert in batches of 100
    const errors = [];
    let inserted = 0;
    for (let i = 0; i < toInsert.length; i += 100) {
      setProgress(`Insertando ${i + 1}–${Math.min(i + 100, toInsert.length)} de ${toInsert.length}…`);
      const batch = toInsert.slice(i, i + 100);
      const { error } = await supabase.from('oferentes_sorteo').insert(batch);
      if (error) errors.push(`Lote ${Math.floor(i/100)+1}: ${error.message}`);
      else inserted += batch.length;
    }

    setSaving(false);
    setProgress('');
    setResult({ ok: inserted, errors });
  };

  const reset = () => { setRows(null); setFileName(''); setResult(null); setParseErr(''); setPage(1); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Plantilla */}
      <div style={{
        background: 'rgba(26,54,104,0.05)', border: '1px solid rgba(26,54,104,0.15)',
        borderRadius: 10, padding: '14px 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>📋 Plantilla Excel</div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
            Columnas: <span className="mono" style={{ fontSize: 11 }}>codigo · nombre_oferente · rnc · rpe · lote_habilitado</span>
          </div>
        </div>
        <button onClick={() => downloadTemplate('oferentes')}
          style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(26,54,104,0.3)', background: 'var(--surface)', color: 'var(--accent)', fontWeight: 600, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          ⬇️ Descargar plantilla
        </button>
      </div>

      {/* Drop zone */}
      {!rows && !parsing && (
        <DropZone onFile={handleFile} label="Seleccionar archivo de Oferentes (.xlsx)" />
      )}

      {parsing && (
        <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-dim)' }}>
          <div className="spin" style={{ width: 28, height: 28, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', display: 'inline-block', marginBottom: 10 }} />
          <div style={{ fontSize: 13 }}>Leyendo {fileName}…</div>
        </div>
      )}

      {parseErr && (
        <div style={{ background: 'rgba(224,80,80,0.08)', border: '1px solid rgba(224,80,80,0.25)', borderRadius: 8, padding: 14, color: 'var(--red)', fontSize: 13 }}>
          ⚠️ {parseErr} <button onClick={reset} style={{ marginLeft: 10, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: 12 }}>Reintentar</button>
        </div>
      )}

      {/* Preview */}
      {rows && !result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontWeight: 600, fontSize: 14, flex: 1 }}>📄 {fileName}</div>
            <Badge color="#16a34a">{validRows.length} válidos</Badge>
            {errorRows.length > 0 && <Badge color="#dc2626">{errorRows.length} con error</Badge>}
            <button onClick={reset} style={{ fontSize: 12, color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Cambiar archivo</button>
          </div>

          {errorRows.length > 0 && (
            <div style={{ background: 'rgba(224,80,80,0.06)', border: '1px solid rgba(224,80,80,0.2)', borderRadius: 8, padding: '10px 14px' }}>
              <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--red)', marginBottom: 6 }}>⚠️ Filas con error — no se importarán:</div>
              {errorRows.map(r => (
                <div key={r._row} style={{ fontSize: 11, color: 'var(--red)', fontFamily: "'DM Mono',monospace" }}>
                  Fila {r._row}: {r._error}
                </div>
              ))}
            </div>
          )}

          <OferentesPreview rows={rows} page={page} onPageChange={setPage} />

          {validRows.length > 0 && (
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={reset} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 14, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={handleImport} disabled={saving}
                style={{ padding: '10px 24px', borderRadius: 8, background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: saving ? 0.75 : 1 }}>
                {saving
                  ? <><span className="spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block' }} /> {progress}</>
                  : `✅ Importar ${validRows.length} oferentes al sorteo ${sorteoNombre}`}
              </button>
            </div>
          )}
        </div>
      )}

      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: result.ok > 0 ? 'rgba(22,163,74,0.06)' : 'rgba(224,80,80,0.06)', border: `1px solid ${result.ok > 0 ? 'rgba(22,163,74,0.25)' : 'rgba(224,80,80,0.25)'}`, borderRadius: 10, padding: '18px 22px' }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>
              {result.ok > 0 ? '✅' : '❌'} Importación {result.errors.length === 0 ? 'completada' : 'parcial'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>
              • <strong>{result.ok}</strong> oferente(s) insertado(s)
            </div>
            {result.errors.length > 0 && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                {result.errors.map((e, i) => (
                  <div key={i} style={{ fontSize: 12, color: 'var(--red)', fontFamily: "'DM Mono',monospace" }}>{e}</div>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={reset} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 14, cursor: 'pointer' }}>
              Nueva importación
            </button>
            {onDone && <button onClick={onDone} style={{ padding: '10px 20px', borderRadius: 8, background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
              Ir al Panel Operador →
            </button>}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Página principal ───────────────────────────────────────────────────── */
const TABS = [
  { id: 'lotes',     label: 'Importar Lotes',     icon: '📦' },
  { id: 'oferentes', label: 'Importar Oferentes',  icon: '🏢' },
];

export default function ImportarPage({ onNavigate }) {
  const { sorteoActivo } = useAuth();
  const sorteoId     = sorteoActivo?.id;
  const sorteoNombre = sorteoActivo?.nombre || 'Sorteo';
  const [tab, setTab] = useState('lotes');

  return (
    <div>
      <SectionHeader
        title="Importar Datos"
        sub={`Carga masiva de lotes y oferentes para ${sorteoNombre}`}
      />

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 24, marginTop: 20,
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 12, padding: 6, width: 'fit-content',
      }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              padding: '10px 22px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600,
              border: 'none', transition: 'all 0.15s',
              background: tab === t.id ? 'var(--accent)' : 'transparent',
              color: tab === t.id ? '#fff' : 'var(--text-dim)',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Panel activo */}
      <div className="card">
        {tab === 'lotes' && (
          <ImportarLotes
            sorteoId={sorteoId}
            sorteoNombre={sorteoNombre}
            onDone={() => onNavigate && onNavigate('/operador')}
          />
        )}
        {tab === 'oferentes' && (
          <ImportarOferentes
            sorteoId={sorteoId}
            sorteoNombre={sorteoNombre}
            onDone={() => onNavigate && onNavigate('/operador')}
          />
        )}
      </div>
    </div>
  );
}
