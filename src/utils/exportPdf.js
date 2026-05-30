// ── Utilidades de Export / Impresión ──

const esc = (str) => String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export function printRoster(players, teamLabel) {
  const w = window.open('', '_blank', 'width=900,height=700');
  const rows = players
    .filter(p => p.rol !== 'Entrenador')
    .sort((a, b) => (a.camiseta || 99) - (b.camiseta || 99))
    .map(p => `<tr>
      <td>#${p.camiseta || '—'}</td>
      <td><strong>${esc(p.name || '—')}</strong>${p.apodo ? ` <em>"${esc(p.apodo)}"</em>` : ''}</td>
      <td>${esc(p.posicion || '—')}</td>
      <td>${esc(p.estado || '—')}</td>
      <td>${esc(p.contacto?.phone || '—')}</td>
    </tr>`).join('');

  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Roster — ${teamLabel}</title>
    <style>body{font-family:Arial,sans-serif;padding:30px;color:#1a1a1a}
    h1{color:#0a6e2e;text-align:center;margin-bottom:5px}
    table{width:100%;border-collapse:collapse;margin-top:20px}
    th{background:#0a6e2e;color:#fff;padding:8px;text-align:left;font-size:12px;text-transform:uppercase}
    td{padding:8px;border-bottom:1px solid #ddd;font-size:13px}
    tr:nth-child(even){background:#f9f9f9}
    .footer{text-align:center;margin-top:30px;font-size:11px;color:#999}
    @media print{body{padding:10px}}</style></head><body>
    <h1>Rugby Orcos Negros — ${teamLabel}</h1>
    <p style="text-align:center;color:#666">Fecha: ${new Date().toLocaleDateString('es-ES')} · ${players.length} guerreros</p>
    <table><thead><tr><th>#</th><th>Nombre</th><th>Posición</th><th>Estado</th><th>Contacto</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="footer">Rugby Orcos Negros 2026 — Fuerza, Honor y Tercer Tiempo.</div>
    </body></html>`);
  w.document.close();
  w.onload = () => w.print();
}

export function printFinances(finances, teamLabel) {
  const w = window.open('', '_blank', 'width=900,height=700');
  const totalIn = finances.filter(f => f.type === 'ingreso').reduce((s, f) => s + Number(f.amount), 0);
  const totalOut = finances.filter(f => f.type === 'egreso').reduce((s, f) => s + Number(f.amount), 0);
  const rows = finances
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map(f => `<tr>
      <td>${f.date || '—'}</td>
      <td>${esc(f.desc || '—')}</td>
      <td style="color:${f.type === 'ingreso' ? '#0a6e2e' : '#c62828'}">${f.type === 'ingreso' ? '+' : '−'}$${Number(f.amount).toLocaleString('es-CO')}</td>
      <td>${esc(f.category || '—')}</td>
    </tr>`).join('');

  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Finanzas — ${teamLabel}</title>
    <style>body{font-family:Arial,sans-serif;padding:30px;color:#1a1a1a}
    h1{color:#0a6e2e;text-align:center;margin-bottom:5px}
    .summary{display:flex;justify-content:space-around;margin:20px 0;padding:15px;background:#f0f8f0;border-radius:8px}
    .summary div{text-align:center}
    table{width:100%;border-collapse:collapse;margin-top:15px}
    th{background:#0a6e2e;color:#fff;padding:8px;text-align:left;font-size:12px;text-transform:uppercase}
    td{padding:8px;border-bottom:1px solid #ddd;font-size:13px}
    .footer{text-align:center;margin-top:30px;font-size:11px;color:#999}
    @media print{body{padding:10px}}</style></head><body>
    <h1>Rugby Orcos Negros — ${teamLabel}</h1>
    <p style="text-align:center;color:#666">Resumen Financiero · ${new Date().toLocaleDateString('es-ES')}</p>
    <div class="summary"><div><strong>Ingresos</strong><br><span style="color:#0a6e2e;font-size:18px">$${totalIn.toLocaleString('es-CO')}</span></div><div><strong>Egresos</strong><br><span style="color:#c62828;font-size:18px">$${totalOut.toLocaleString('es-CO')}</span></div><div><strong>Balance</strong><br><span style="font-size:18px">$${(totalIn - totalOut).toLocaleString('es-CO')}</span></div></div>
    <table><thead><tr><th>Fecha</th><th>Descripción</th><th>Monto</th><th>Categoría</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="footer">Rugby Orcos Negros 2026 — Fuerza, Honor y Tercer Tiempo.</div>
    </body></html>`);
  w.document.close();
  w.onload = () => w.print();
}
