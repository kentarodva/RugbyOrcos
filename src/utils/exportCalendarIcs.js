import { localDateKey } from './agendaItems';
// ── Generador y Exportador de Calendario .ICS (RFC 5545) ──
// Compatible con Google Calendar, Apple Calendar (iPhone/Mac), Outlook y Android

function formatDateToICS(dateStr, timeStr = '15:00') {
  if (!dateStr) return null;
  // Parse YYYY-MM-DD
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = (timeStr || '15:00').split(':').map(Number);

  const d = new Date(Date.UTC(year, (month || 1) - 1, day || 1, hours || 15, minutes || 0, 0));
  const pad = (n) => String(n).padStart(2, '0');

  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
}

function addHoursToICS(dateStr, timeStr = '15:00', durationHours = 2) {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = (timeStr || '15:00').split(':').map(Number);

  const d = new Date(Date.UTC(year, (month || 1) - 1, day || 1, (hours || 15) + durationHours, minutes || 0, 0));
  const pad = (n) => String(n).padStart(2, '0');

  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
}

export function generateIcsCalendar({ matches = [], teamLabel = 'Rugby Orcos Negros Club' }) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Rugby Orcos Negros Club//Fixture Oficial v5.0//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${teamLabel} — Fixture de Partidos`,
    'X-WR-TIMEZONE:America/Bogota',
  ];

  matches.forEach((m, idx) => {
    const opponent = m.opponent || m.opponent_name || m.rival || 'Rival por definir';
    const tournament = m.tournament || 'Torneo Oficial';
    const location = m.location || m.field || 'Cancha Oficial';
    const date = m.date;
    const time = m.time || '15:00';

    if (!date) return;

    const dtStart = formatDateToICS(date, time);
    const dtEnd = addHoursToICS(date, time, 2);
    if (!dtStart || !dtEnd) return;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:orcos_match_${m.id || idx}_${date}@orcosnegros.com`);
    lines.push(`DTSTAMP:${dtStart}`);
    lines.push(`DTSTART:${dtStart}`);
    lines.push(`DTEND:${dtEnd}`);
    lines.push(`SUMMARY:🏉 Rugby: Orcos Negros vs ${opponent}`);
    lines.push(`DESCRIPTION:Encuentro oficial: ${tournament}. Cancha: ${location}. ¡Fuerza, Honor y Tercer Tiempo!`);
    lines.push(`LOCATION:${location}`);
    lines.push('STATUS:CONFIRMED');

    // Recordatorio automático 2 horas antes
    lines.push('BEGIN:VALARM');
    lines.push('TRIGGER:-PT2H');
    lines.push('ACTION:DISPLAY');
    lines.push(`DESCRIPTION:Citación Partido: Orcos vs ${opponent} en 2 horas`);
    lines.push('END:VALARM');

    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadCalendarIcs({ matches = [], teamLabel = 'Rugby Orcos Negros Club' }) {
  const icsData = generateIcsCalendar({ matches, teamLabel });
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `calendario_rugby_orcos_${localDateKey()}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
