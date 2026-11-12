import { localDateKey } from './agendaItems';
// ── Exportador Oficial de Roster a CSV / Excel para Torneos de Rugby ──
// Genera archivo tabular con UTF-8 BOM (\uFEFF) y separador estándar para compatibilidad directa
// con Microsoft Excel en español y planillas de la Federación Colombiana de Rugby (FCR).

function escapeCsvField(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Genera el contenido de texto CSV con BOM UTF-8 para la nómina de jugadores.
 * @param {Array} players - Lista de jugadores
 * @param {string} teamLabel - Nombre de la categoría o equipo
 * @returns {string} Cadena CSV formateada
 */
export function generateRosterCsv(players = [], teamLabel = 'Orcos Rugby Club') {
  const headers = [
    'N° Camiseta',
    'Nombres',
    'Apellidos',
    'Nombre Completo',
    'Apodo',
    'Tipo Documento',
    'N° Documento',
    'Categoría',
    'Posición Principal',
    'Fecha de Nacimiento',
    'Edad',
    'EPS / Seguro Médico',
    'Grupo Sanguíneo (RH)',
    'Teléfono',
    'Contacto de Emergencia',
    'Teléfono de Emergencia',
    'Talla Jersey',
    'Talla Pantaloneta',
    'Estado en Club'
  ];

  const rows = players.map(p => {
    const cloth = p.clothingSizes || p.clothing || {};
    const age = p.birth_date
      ? Math.max(0, Math.floor((Date.now() - new Date(p.birth_date).getTime()) / 31557600000))
      : (p.edad || '—');

    return [
      p.camiseta || '—',
      p.name || '',
      p.last_name || '',
      `${p.name || ''} ${p.last_name || ''}`.trim() || 'Guerrero',
      p.apodo || '',
      p.doc_type || 'CC',
      p.cedula || p.documento || '—',
      (p.teamCategory || teamLabel).replace('orcos_', '').replace(/_/g, ' ').toUpperCase(),
      p.posicion || 'JUGADOR',
      p.birth_date || '—',
      age,
      p.health_insurance || p.eps || '—',
      p.blood_type || p.rh || '—',
      p.contacto?.phone || p.phone || '—',
      p.emergency_contact_name || '—',
      p.emergency_contact_phone || '—',
      cloth.jersey || 'M',
      cloth.shorts || 'M',
      (p.estado || 'activo').toUpperCase()
    ].map(escapeCsvField).join(';');
  });

  const headerLine = headers.map(escapeCsvField).join(';');
  // \uFEFF es el Byte Order Mark (BOM) UTF-8 para que Excel reconozca tildes y eñes
  return '\uFEFF' + [headerLine, ...rows].join('\r\n');
}

/**
 * Descarga el archivo CSV en el navegador del usuario.
 */
export function downloadRosterCsv(players = [], teamLabel = 'Orcos_Rugby_Club') {
  const csvContent = generateRosterCsv(players, teamLabel);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeLabel = teamLabel.replace(/\s+/g, '_').toLowerCase();
  const dateStr = localDateKey();
  a.href = url;
  a.download = `Planilla_Oficial_${safeLabel}_${dateStr}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
