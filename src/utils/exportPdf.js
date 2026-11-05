// ── Utilidades de Export / Impresión ──

import { formatLocalDate } from './dates.js';

const esc = (str) => String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export function printRoster(players, teamLabel) {
  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) return;
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

  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Roster — ${esc(teamLabel)}</title>
    <style>body{font-family:Arial,sans-serif;padding:30px;color:#1a1a1a}
    h1{color:#0a6e2e;text-align:center;margin-bottom:5px}
    table{width:100%;border-collapse:collapse;margin-top:20px}
    th{background:#0a6e2e;color:#fff;padding:8px;text-align:left;font-size:12px;text-transform:uppercase}
    td{padding:8px;border-bottom:1px solid #ddd;font-size:13px}
    tr:nth-child(even){background:#f9f9f9}
    .footer{text-align:center;margin-top:30px;font-size:11px;color:#999}
    @media print{body{padding:10px}}</style></head><body>
    <h1>Rugby Orcos Negros — ${esc(teamLabel)}</h1>
    <p style="text-align:center;color:#666">Fecha: ${formatLocalDate(new Date())} · ${players.length} guerreros</p>
    <table><thead><tr><th>#</th><th>Nombre</th><th>Posición</th><th>Estado</th><th>Contacto</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="footer">Rugby Orcos Negros 2026 — Fuerza, Honor y Tercer Tiempo.</div>
    </body></html>`);
  w.document.close();
  w.onload = () => w.print();
}

export function printFinances(finances, teamLabel) {
  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) return;
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

  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Finanzas — ${esc(teamLabel)}</title>
    <style>body{font-family:Arial,sans-serif;padding:30px;color:#1a1a1a}
    h1{color:#0a6e2e;text-align:center;margin-bottom:5px}
    .summary{display:flex;justify-content:space-around;margin:20px 0;padding:15px;background:#f0f8f0;border-radius:8px}
    .summary div{text-align:center}
    table{width:100%;border-collapse:collapse;margin-top:15px}
    th{background:#0a6e2e;color:#fff;padding:8px;text-align:left;font-size:12px;text-transform:uppercase}
    td{padding:8px;border-bottom:1px solid #ddd;font-size:13px}
    .footer{text-align:center;margin-top:30px;font-size:11px;color:#999}
    @media print{body{padding:10px}}</style></head><body>
    <h1>Rugby Orcos Negros — ${esc(teamLabel)}</h1>
    <p style="text-align:center;color:#666">Resumen Financiero · ${formatLocalDate(new Date())}</p>
    <div class="summary"><div><strong>Ingresos</strong><br><span style="color:#0a6e2e;font-size:18px">$${totalIn.toLocaleString('es-CO')}</span></div><div><strong>Egresos</strong><br><span style="color:#c62828;font-size:18px">$${totalOut.toLocaleString('es-CO')}</span></div><div><strong>Balance</strong><br><span style="font-size:18px">$${(totalIn - totalOut).toLocaleString('es-CO')}</span></div></div>
    <table><thead><tr><th>Fecha</th><th>Descripción</th><th>Monto</th><th>Categoría</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="footer">Rugby Orcos Negros 2026 — Fuerza, Honor y Tercer Tiempo.</div>
    </body></html>`);
  w.document.close();
  w.onload = () => w.print();
}

export function printOfficialMatchSheet({
  match = {},
  lineup = {},
  players = [],
  teamLabel = 'Rugby Orcos Negros Club',
  division = 'Masculina Mayor',
}) {
  const w = window.open('', '_blank', 'width=980,height=850');
  if (!w) return;

  const matchDate = match.date || formatLocalDate(new Date());
  const matchTime = match.time || '15:00';
  const opponent = match.opponent || match.opponent_name || 'Rival por definir';
  const location = match.location || 'Cancha Oficial';
  const tournament = match.tournament || 'Torneo Oficial de Rugby';

  const STANDARD_SLOTS = [
    { num: 1, name: 'Pilar Izquierdo (Loosehead)' },
    { num: 2, name: 'Hooker (Talonador)' },
    { num: 3, name: 'Pilar Derecho (Tighthead)' },
    { num: 4, name: 'Segunda Línea' },
    { num: 5, name: 'Segunda Línea' },
    { num: 6, name: 'Flanker Ciego' },
    { num: 7, name: 'Flanker Abierto' },
    { num: 8, name: 'Octavo (N° 8)' },
    { num: 9, name: 'Medio Scrum' },
    { num: 10, name: 'Apertura (Fly-half)' },
    { num: 11, name: 'Wing Izquierdo' },
    { num: 12, name: 'Primer Centro' },
    { num: 13, name: 'Segundo Centro' },
    { num: 14, name: 'Wing Derecho' },
    { num: 15, name: 'Zaguero (Fullback)' },
  ];

  const startersRows = STANDARD_SLOTS.map(slot => {
    const playerId = lineup[slot.num];
    const player = players.find(p => String(p.id) === String(playerId));
    const doc = player ? `${player.document_type || 'CC'} ${player.document_number || '—'}` : '—';
    const eps = player?.health_insurance || '—';
    const name = player ? `${player.name || ''} ${player.last_name || ''}`.trim() : '— VACANTE —';
    const isCap = player?.rol === 'Capitan';
    return `<tr>
      <td style="text-align:center;font-weight:900;font-size:13px;background:#eef7ee">${slot.num}</td>
      <td><strong>${esc(name)}</strong>${isCap ? ' <span style="background:#ffd740;color:#000;font-size:10px;padding:1px 5px;border-radius:3px;font-weight:900">CAP</span>' : ''}</td>
      <td style="font-size:12px;color:#444">${esc(slot.name)}</td>
      <td style="font-family:monospace;font-size:12px">${esc(doc)}</td>
      <td style="font-size:12px">${esc(eps)}</td>
      <td style="border-bottom:1px solid #aaa;width:85px"></td>
    </tr>`;
  }).join('');

  const SUB_NUMS = [16, 17, 18, 19, 20, 21, 22, 23];
  const subsRows = SUB_NUMS.map(num => {
    const playerId = lineup[num] || lineup[`sub_${num}`];
    const player = players.find(p => String(p.id) === String(playerId));
    const doc = player ? `${player.document_type || 'CC'} ${player.document_number || '—'}` : '—';
    const eps = player?.health_insurance || '—';
    const name = player ? `${player.name || ''} ${player.last_name || ''}`.trim() : '— DISPONIBLE —';
    return `<tr>
      <td style="text-align:center;font-weight:900;font-size:13px;background:#f5f5f5">${num}</td>
      <td><strong>${esc(name)}</strong></td>
      <td style="font-size:12px;color:#444">${player?.posicion ? esc(player.posicion) : 'Reserva'}</td>
      <td style="font-family:monospace;font-size:12px">${esc(doc)}</td>
      <td style="font-size:12px">${esc(eps)}</td>
      <td style="border-bottom:1px solid #aaa;width:85px"></td>
    </tr>`;
  }).join('');

  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>Planilla Oficial de Partido — ${esc(teamLabel)} vs ${esc(opponent)}</title>
    <style>
      @page { size: A4 portrait; margin: 12mm; }
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #111; margin: 0; padding: 10px; font-size: 11px; }
      .header-box { border: 2px solid #0a6e2e; border-radius: 8px; padding: 10px 14px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; background: #fbfdfb; }
      .title-block h1 { margin: 0; font-size: 18px; color: #0a6e2e; text-transform: uppercase; letter-spacing: 0.5px; }
      .title-block h2 { margin: 3px 0 0 0; font-size: 13px; color: #333; font-weight: 600; }
      .match-info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px 12px; margin-bottom: 12px; background: #f5f5f5; padding: 8px 12px; border-radius: 6px; font-size: 11px; }
      .match-info-grid div strong { color: #0a6e2e; text-transform: uppercase; font-size: 10px; display: block; margin-bottom: 1px; }
      table { width: 100%; border-collapse: collapse; margin-top: 6px; margin-bottom: 12px; }
      th { background: #0a6e2e; color: #fff; padding: 5px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; }
      td { padding: 4px 8px; border-bottom: 1px solid #e0e0e0; vertical-align: middle; }
      tr:nth-child(even) td { background-color: #fafafa; }
      .section-badge { background: #0a6e2e; color: #fff; font-size: 10.5px; font-weight: 900; padding: 3px 8px; border-radius: 4px; display: inline-block; margin-bottom: 4px; text-transform: uppercase; }
      .signatures-box { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 18px; padding-top: 10px; page-break-inside: avoid; }
      .sig-line { border-top: 1.5px solid #333; text-align: center; padding-top: 4px; font-size: 11px; font-weight: 600; }
      .sig-line small { display: block; color: #666; font-size: 9.5px; font-weight: normal; margin-top: 2px; }
      .legal-notice { font-size: 8.5px; color: #666; text-align: center; margin-top: 12px; border-top: 1px dashed #ccc; padding-top: 6px; }
      @media print {
        body { padding: 0; }
        .no-print { display: none !important; }
      }
    </style>
  </head>
  <body>
    <div class="header-box">
      <div class="title-block">
        <h1>RUGBY ORCOS NEGROS CLUB</h1>
        <h2>PLANILLA OFICIAL DE PARTIDO — HOJA DE ALINEACIÓN</h2>
      </div>
      <div style="text-align:right">
        <span style="border:1.5px solid #0a6e2e;color:#0a6e2e;font-weight:900;padding:4px 10px;border-radius:6px;font-size:12px;text-transform:uppercase">
          DIVISIÓN: ${esc(division)}
        </span>
      </div>
    </div>

    <div class="match-info-grid">
      <div><strong>Torneo / Jornada:</strong> ${esc(tournament)}</div>
      <div><strong>Rival:</strong> ${esc(opponent)}</div>
      <div><strong>Fecha y Hora:</strong> ${esc(matchDate)} · ${esc(matchTime)}</div>
      <div><strong>Cancha / Sede:</strong> ${esc(location)}</div>
    </div>

    <div>
      <span class="section-badge">XV Titular Inicial (Dorsales #1 a #15)</span>
      <table>
        <thead>
          <tr>
            <th style="width:35px;text-align:center">N°</th>
            <th>Guerrero (Nombre y Apellidos)</th>
            <th>Posición Oficial</th>
            <th>Documento Identidad</th>
            <th>EPS / Seguro</th>
            <th style="width:85px;text-align:center">Firma / OK</th>
          </tr>
        </thead>
        <tbody>
          ${startersRows}
        </tbody>
      </table>
    </div>

    <div style="margin-top:8px">
      <span class="section-badge" style="background:#444">Reservas y Suplentes (#16 a #23)</span>
      <table>
        <thead>
          <tr>
            <th style="width:35px;text-align:center;background:#444">N°</th>
            <th style="background:#444">Guerrero Suplente</th>
            <th style="background:#444">Posición / Rol</th>
            <th style="background:#444">Documento Identidad</th>
            <th style="background:#444">EPS / Seguro</th>
            <th style="width:85px;text-align:center;background:#444">Firma / Ingreso</th>
          </tr>
        </thead>
        <tbody>
          ${subsRows}
        </tbody>
      </table>
    </div>

    <div class="signatures-box">
      <div class="sig-line">
        Capitán / Delegado Orcos
        <small>Firma y Aceptación de Nómina</small>
      </div>
      <div class="sig-line">
        Capitán / Delegado Rival
        <small>Firma y Verificación</small>
      </div>
      <div class="sig-line">
        Árbitro Central / Mesa Técnica
        <small>Firma y Validación Oficial</small>
      </div>
    </div>

    <div class="legal-notice">
      Certificación Médica y Antidopaje: Todos los deportistas listados cuentan con afiliación vigente al sistema de salud (EPS) y se encuentran aptos físicamente bajo las directrices del Reglamento de Juego World Rugby y la Federación Colombiana de Rugby (FCR).
    </div>
  </body>
  </html>`);

  w.document.close();
  w.onload = () => w.print();
}


export function printCertificateOfAffiliation({
  player = {},
  teamLabel = 'Rugby Orcos Negros Club',
  division = 'Masculina Mayor',
  presidentName = 'Comité Ejecutivo & Presidencia',
  issuer = 'Tesorería y Secretaría General',
}) {
  const w = window.open('', '_blank', 'width=900,height=800');
  if (!w) return;

  const doc = `${player.document_type || 'CC'} ${player.document_number || '—'}`;
  const fullName = `${player.name || ''} ${player.last_name || ''}`.trim() || 'Deportista';
  const issueDate = formatLocalDate(new Date());
  const year = new Date().getFullYear();

  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>Certificado de Afiliación y Paz y Salvo — ${esc(fullName)}</title>
    <style>
      @page { size: letter portrait; margin: 20mm; }
      body { font-family: "Georgia", serif; color: #1a1a1a; margin: 0; padding: 25px; line-height: 1.6; }
      .header { text-align: center; border-bottom: 3px double #0a6e2e; padding-bottom: 18px; margin-bottom: 25px; }
      .header h1 { font-family: Arial, sans-serif; font-size: 24px; color: #0a6e2e; margin: 0; letter-spacing: 1px; }
      .header h2 { font-family: Arial, sans-serif; font-size: 13px; color: #555; margin: 5px 0 0 0; text-transform: uppercase; }
      .cert-title { text-align: center; font-size: 19px; font-weight: bold; margin: 30px 0; color: #111; letter-spacing: 0.5px; text-transform: uppercase; }
      .body-text { font-size: 14.5px; text-align: justify; margin-bottom: 25px; text-indent: 30px; }
      .data-table { width: 100%; border-collapse: collapse; margin: 25px 0; font-family: Arial, sans-serif; font-size: 12.5px; }
      .data-table td { padding: 8px 12px; border: 1px solid #ddd; }
      .data-table td.label { font-weight: bold; background: #f9fbf9; width: 35%; color: #0a6e2e; }
      .seal-box { display: flex; justify-content: space-between; margin-top: 60px; page-break-inside: avoid; }
      .signature-col { text-align: center; width: 45%; }
      .signature-line { border-top: 1.5px solid #222; margin-top: 50px; padding-top: 6px; font-size: 13px; font-family: Arial, sans-serif; font-weight: bold; }
      .signature-col small { color: #666; font-size: 11px; display: block; }
      .footer-note { text-align: center; font-size: 10px; color: #888; margin-top: 40px; border-top: 1px solid #eee; padding-top: 8px; font-family: Arial, sans-serif; }
      @media print { body { padding: 0; } }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>${esc(teamLabel.toUpperCase())}</h1>
      <h2>Personería Deportiva & Afiliación FCR · NIT: 901.458.712-4</h2>
      <h2>Bello / Medellín — Colombia · Temporada ${year}</h2>
    </div>

    <div class="cert-title">
      CERTIFICADO OFICIAL DE AFILIACIÓN Y PAZ Y SALVO
    </div>

    <p class="body-text">
      El suscrito Representante Legal y el Comité Ejecutivo del <strong>RUGBY ORCOS NEGROS CLUB</strong>, por medio del presente documento:
    </p>

    <div style="text-align:center;font-size:16px;font-weight:bold;margin:20px 0;color:#0a6e2e">
      HACEN CONSTAR QUE:
    </div>

    <p class="body-text">
      El (la) deportista <strong>${esc(fullName.toUpperCase())}</strong>, identificado(a) con documento oficial de identidad <strong>${esc(doc)}</strong>, es miembro activo e inscrito en el registro oficial de deportistas de nuestro club, participando en entrenamientos y torneos oficiales dentro de la división <strong>${esc(division)}</strong>.
    </p>

    <table class="data-table">
      <tr>
        <td class="label">Nombre del Deportista:</td>
        <td><strong>${esc(fullName)}</strong></td>
      </tr>
      <tr>
        <td class="label">Documento de Identidad:</td>
        <td>${esc(doc)}</td>
      </tr>
      <tr>
        <td class="label">División / Categoría:</td>
        <td>${esc(division)}</td>
      </tr>
      <tr>
        <td class="label">Posición Deportiva:</td>
        <td>${esc(player.posicion || 'Jugador de Campo')}</td>
      </tr>
      <tr>
        <td class="label">Cobertura Médica (EPS):</td>
        <td>${esc(player.health_insurance || 'Activa')}</td>
      </tr>
      <tr>
        <td class="label">Estado de Tesorería:</td>
        <td><strong style="color:#0a6e2e">A PAZ Y SALVO</strong> (Sin saldos pendientes a la fecha)</td>
      </tr>
    </table>

    <p class="body-text">
      El (la) deportista se encuentra en pleno goce de sus derechos deportivos y a paz y salvo por concepto de cuotas de sostenimiento, derechos federativos y compromisos institucionales.
    </p>

    <p class="body-text">
      Se expide la presente certificación a solicitud de la parte interesada, en la ciudad de Medellín, a los <strong>${esc(issueDate)}</strong>.
    </p>

    <div class="seal-box">
      <div class="signature-col">
        <div class="signature-line">
          ${esc(presidentName)}
          <small>Presidencia & Representación Legal</small>
          <small>Rugby Orcos Negros Club</small>
        </div>
      </div>
      <div class="signature-col">
        <div class="signature-line">
          ${esc(issuer)}
          <small>Secretaría & Control Financiero</small>
          <small>Registro Oficial N° ORC-${esc(player.id || '2026')}</small>
        </div>
      </div>
    </div>

    <div class="footer-note">
      Documento oficial emitido con validez para trámites académicos, laborales, convenios y acreditación en torneos de la Federación Colombiana de Rugby. «Fuerza, Honor y Tercer Tiempo».
    </div>
  </body>
  </html>`);

  w.document.close();
  w.onload = () => w.print();
}
