import { describe, it, expect, vi } from 'vitest';
import { generateIcsCalendar, downloadCalendarIcs } from '../../utils/exportCalendarIcs';

describe('exportCalendarIcs — Sincronización RFC 5545 con Google/Apple Calendar', () => {
  it('genera estructura VCALENDAR con eventos, alarmas y resumen correctos', () => {
    const matches = [
      {
        id: 'm1',
        opponent: 'Toros RC',
        tournament: 'Copa Antioquia 2026',
        location: 'Cancha Copacabana',
        date: '2026-07-20',
        time: '16:00',
      },
    ];

    const ics = generateIcsCalendar({ matches, teamLabel: 'Rugby Orcos Negros' });

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('SUMMARY:🏉 Rugby: Orcos Negros vs Toros RC');
    expect(ics).toContain('LOCATION:Cancha Copacabana');
    expect(ics).toContain('BEGIN:VALARM');
    expect(ics).toContain('TRIGGER:-PT2H');
    expect(ics).toContain('END:VCALENDAR');
  });

  it('descarga el archivo .ics vía blob en el navegador', () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const setAttributeSpy = vi.spyOn(HTMLAnchorElement.prototype, 'setAttribute');

    const result = downloadCalendarIcs({
      matches: [{ id: 'm2', opponent: 'Águilas', date: '2026-08-10' }],
    });

    expect(result).toBe(true);
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
    setAttributeSpy.mockRestore();
  });
});
