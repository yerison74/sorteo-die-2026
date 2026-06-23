import { useState } from 'react';
import { fmt, padLote, POSICION_LABELS, POSICION_COLORS, POSICION_ICONS } from '../utils';
import { SectionHeader, EmptyState } from '../components/UI';

/* ─── Helpers de exportación ─────────────────────────────────────────────── */

function buildExportRows(sortedLotes, lotes, items, resultados) {
  const rows = [];
  sortedLotes.forEach(l => {
    const loteRes   = resultados.filter(r => r.lote_id === l.id).sort((a, b) => a.posicion - b.posicion);
    const loteItems = items.filter(it => it.lote_id === l.id);
    const g1 = loteRes.find(r => r.posicion === 1);
    const g2 = loteRes.find(r => r.posicion === 2);
    const g3 = loteRes.find(r => r.posicion === 3);

    // One summary row per lote
    rows.push({
      'Lote':              `#${padLote(l.numero_lote)}`,
      'Tipo':              l.tipo,
      'Monto Lote':        l.monto_lote,
      'Ganador Principal': g1 ? g1.nombre_oferente : '',
      'RNC Ganador':       g1 ? g1.rnc : '',
      'RPE Ganador':       g1 ? g1.rpe : '',
      'Código Ganador':    g1 ? g1.codigo_oferente : '',
      'Suplente 1':        g2 ? g2.nombre_oferente : '',
      'RNC Suplente 1':    g2 ? g2.rnc : '',
      'Suplente 2':        g3 ? g3.nombre_oferente : '',
      'RNC Suplente 2':    g3 ? g3.rnc : '',
      'Centros Educativos': loteItems.map(it => it.nombre_centro_educativo).join(' | '),
    });
  });
  return rows;
}

function exportExcel(sortedLotes, lotes, items, resultados) {
  // SheetJS loaded via CDN (added to public/index.html)
  const XLSX = window.XLSX;
  if (!XLSX) { alert('Librería Excel no disponible. Recarga la página.'); return; }

  const rows = buildExportRows(sortedLotes, lotes, items, resultados);
  const ws   = XLSX.utils.json_to_sheet(rows);

  // Column widths
  ws['!cols'] = [
    { wch: 8 }, { wch: 8 }, { wch: 14 }, { wch: 36 }, { wch: 14 },
    { wch: 12 }, { wch: 22 }, { wch: 36 }, { wch: 14 }, { wch: 36 },
    { wch: 14 }, { wch: 60 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Ganadores');
  XLSX.writeFile(wb, 'Ganadores_Sorteo_DIE_2026.xlsx');
}

function exportPDF(sortedLotes, lotes, items, resultados) {
  const { jsPDF } = window.jspdf;
  if (!jsPDF) { alert('Librería PDF no disponible. Recarga la página.'); return; }

  const doc    = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW  = doc.internal.pageSize.getWidth();
  const pageH  = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y        = margin;

  const navy   = [26, 54, 104];
  const gold   = [180, 83, 9];
  const gray   = [100, 116, 139];
  const light  = [241, 245, 249];
  const white  = [255, 255, 255];

  // ── Header ─────────────────────────────────────────────────────────────
  doc.setFillColor(...navy);
  doc.rect(0, 0, pageW, 18, 'F');
  doc.setTextColor(...white);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Ganadores del Sorteo – DIE 2026', margin, 12);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const fecha = new Date().toLocaleDateString('es-DO', { day: '2-digit', month: 'long', year: 'numeric' });
  doc.text(`Generado: ${fecha}`, pageW - margin, 12, { align: 'right' });
  y = 24;

  // ── Por cada lote ───────────────────────────────────────────────────────
  sortedLotes.forEach((l, idx) => {
    const loteRes   = resultados.filter(r => r.lote_id === l.id).sort((a, b) => a.posicion - b.posicion);
    const loteItems = items.filter(it => it.lote_id === l.id);
    const g1 = loteRes.find(r => r.posicion === 1);
    const g2 = loteRes.find(r => r.posicion === 2);
    const g3 = loteRes.find(r => r.posicion === 3);

    // Estimate space needed
    const neededH = 10 + 28 + (loteItems.length > 0 ? 8 + loteItems.length * 6 + 4 : 0) + 6;
    if (y + neededH > pageH - margin) {
      doc.addPage();
      y = margin;
    }

    // Lote title bar
    doc.setFillColor(...light);
    doc.roundedRect(margin, y, pageW - margin * 2, 9, 1, 1, 'F');
    doc.setTextColor(...navy);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`Lote #${padLote(l.numero_lote)}  –  ${l.tipo}  –  ${fmt(l.monto_lote)}`, margin + 3, y + 6);
    y += 11;

    // Winners grid (3 columns)
    const colW = (pageW - margin * 2 - 8) / 3;
    const positions = [
      { pos: 1, winner: g1, color: navy,  label: 'Ganador Principal', icon: '👑' },
      { pos: 2, winner: g2, color: gray,  label: 'Suplente 1',        icon: '🥈' },
      { pos: 3, winner: g3, color: gold,  label: 'Suplente 2',        icon: '🥉' },
    ];

    positions.forEach(({ pos, winner, color, label }, ci) => {
      const cx = margin + ci * (colW + 4);
      // Card border
      doc.setDrawColor(...color);
      doc.setLineWidth(0.4);
      doc.roundedRect(cx, y, colW, 26, 1, 1, 'S');
      // Label badge
      doc.setFillColor(...color);
      doc.roundedRect(cx + 2, y + 2, colW - 4, 5, 0.8, 0.8, 'F');
      doc.setTextColor(...white);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.text(label.toUpperCase(), cx + colW / 2, y + 5.5, { align: 'center' });

      if (winner) {
        doc.setTextColor(30, 30, 30);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        const lines = doc.splitTextToSize(winner.nombre_oferente, colW - 4);
        doc.text(lines, cx + 2, y + 12);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(...gray);
        doc.text(`Código: ${winner.codigo_oferente || '—'}`, cx + 2, y + 20);
        doc.text(`RNC: ${winner.rnc || '—'}  RPE: ${winner.rpe || '—'}`, cx + 2, y + 24);
      } else {
        doc.setTextColor(...gray);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'italic');
        doc.text('No registrado', cx + colW / 2, y + 16, { align: 'center' });
      }
    });
    y += 30;

    // Centros educativos mini-table
    if (loteItems.length > 0) {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...gray);
      doc.text(`Centros Educativos (${loteItems.length})`, margin, y + 3);
      y += 6;

      // Table header
      doc.setFillColor(...navy);
      doc.rect(margin, y, pageW - margin * 2, 5, 'F');
      doc.setTextColor(...white);
      doc.setFontSize(6.5);
      doc.text('Centro Educativo', margin + 2, y + 3.5);
      doc.text('Provincia', margin + 130, y + 3.5);
      doc.text('Monto', pageW - margin - 2, y + 3.5, { align: 'right' });
      y += 5;

      loteItems.forEach((it, i) => {
        if (y > pageH - margin - 8) { doc.addPage(); y = margin; }
        if (i % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(margin, y, pageW - margin * 2, 5.5, 'F');
        }
        doc.setTextColor(30, 30, 30);
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        const nameLines = doc.splitTextToSize(it.nombre_centro_educativo, 125);
        doc.text(nameLines[0], margin + 2, y + 3.8);
        doc.text(it.provincia || '', margin + 130, y + 3.8);
        doc.text(fmt(it.monto_obra), pageW - margin - 2, y + 3.8, { align: 'right' });
        y += 5.5;
      });
      y += 2;
    }

    y += 6; // spacing between lotes
  });

  // ── Footer on every page ────────────────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setTextColor(...gray);
    doc.text(`Página ${p} de ${totalPages}  ·  Dirección de Infraestructura Escolar – DIE 2026`, pageW / 2, pageH - 6, { align: 'center' });
  }

  doc.save('Ganadores_Sorteo_DIE_2026.pdf');
}

/* ─── Sub-componentes ────────────────────────────────────────────────────── */

function PosCard({ posicion, resultado }) {
  const c = POSICION_COLORS[posicion];
  return (
    <div style={{
      background: posicion === 1 ? 'linear-gradient(135deg, var(--surface2), rgba(26,54,104,0.08))' : 'var(--surface2)',
      border: `1px solid ${c}40`,
      borderRadius: 'var(--radius)', padding: 16,
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        background: c + '20', color: c, padding: '3px 8px', borderRadius: 4,
        fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
        alignSelf: 'flex-start',
      }}>
        {POSICION_ICONS[posicion]} {POSICION_LABELS[posicion]}
      </div>
      {resultado ? (
        <>
          <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{resultado.nombre_oferente}</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>{resultado.codigo_oferente}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2 }}>
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>RNC: {resultado.rnc}</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>RPE: {resultado.rpe}</div>
          </div>
        </>
      ) : (
        <div style={{ color: 'var(--text-dim)', fontSize: 12 }}>No registrado</div>
      )}
    </div>
  );
}

/* ─── Botones de exportación ─────────────────────────────────────────────── */
function ExportButtons({ onClick }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button
        onClick={() => onClick('excel')}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '7px 14px', borderRadius: 6, border: '1px solid #16a34a40',
          background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
          color: '#15803d', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          boxShadow: '0 1px 3px #16a34a20',
        }}
      >
        <span style={{ fontSize: 14 }}>📊</span> Exportar Excel
      </button>
      <button
        onClick={() => onClick('pdf')}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '7px 14px', borderRadius: 6, border: '1px solid #dc262640',
          background: 'linear-gradient(135deg, #fff1f2, #ffe4e6)',
          color: '#b91c1c', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          boxShadow: '0 1px 3px #dc262620',
        }}
      >
        <span style={{ fontSize: 14 }}>📄</span> Exportar PDF
      </button>
    </div>
  );
}

/* ─── Página principal ───────────────────────────────────────────────────── */
export default function GanadoresPage({ lotes, items, resultados }) {
  const [expanded, setExpanded] = useState(null);

  const sortedLotes = lotes
    .filter(l => resultados.some(r => r.lote_id === l.id && r.posicion === 1))
    .sort((a, b) => a.numero_lote - b.numero_lote);

  function handleExport(type) {
    if (type === 'excel') exportExcel(sortedLotes, lotes, items, resultados);
    else                  exportPDF(sortedLotes, lotes, items, resultados);
  }

  if (sortedLotes.length === 0) {
    return (
      <div>
        <SectionHeader title="Ganadores del Sorteo" sub="Historial de lotes adjudicados" />
        <div className="card" style={{ marginTop: 20 }}>
          <EmptyState icon="🏆" text="Aún no hay ganadores registrados" />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header + botones */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <SectionHeader
          title="Ganadores del Sorteo"
          sub={`${sortedLotes.length} lote${sortedLotes.length !== 1 ? 's' : ''} adjudicado${sortedLotes.length !== 1 ? 's' : ''}`}
        />
        <ExportButtons onClick={handleExport} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sortedLotes.map(l => {
          const loteRes   = resultados.filter(r => r.lote_id === l.id).sort((a, b) => a.posicion - b.posicion);
          const loteItems = items.filter(it => it.lote_id === l.id);
          const g1        = loteRes.find(r => r.posicion === 1);
          const isOpen    = expanded === l.id;

          return (
            <div key={l.id} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', overflow: 'hidden',
              boxShadow: 'var(--shadow-card)',
            }}>
              <div
                onClick={() => setExpanded(isOpen ? null : l.id)}
                style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
              >
                <span className="mono" style={{ fontSize: 16, fontWeight: 600, minWidth: 56 }}>
                  #{padLote(l.numero_lote)}
                </span>
                <span className={`badge badge-${l.tipo.toLowerCase()}`}>{l.tipo}</span>
                <div style={{ flex: 1, marginLeft: 4 }}>
                  {g1 && <div style={{ fontSize: 14, fontWeight: 600 }}>{POSICION_ICONS[1]} {g1.nombre_oferente}</div>}
                  <div className="mono" style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{fmt(l.monto_lote)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{loteRes.length}/3 posiciones</span>
                  <span style={{ color: 'var(--text-dim)', fontSize: 16, transition: 'transform 0.2s', transform: isOpen ? 'rotate(90deg)' : 'none' }}>▸</span>
                </div>
              </div>

              {isOpen && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px 20px' }} className="fade-in">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                    {[1, 2, 3].map(pos => (
                      <PosCard key={pos} posicion={pos} resultado={loteRes.find(r => r.posicion === pos)} />
                    ))}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
                      Centros Educativos ({loteItems.length})
                    </div>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Centro Educativo</th>
                          <th>Provincia</th>
                          <th>Monto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loteItems.map((it, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 500, fontSize: 13 }}>{it.nombre_centro_educativo}</td>
                            <td style={{ color: 'var(--text-dim)', fontSize: 12 }}>{it.provincia}</td>
                            <td className="mono" style={{ fontSize: 12 }}>{fmt(it.monto_obra)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
