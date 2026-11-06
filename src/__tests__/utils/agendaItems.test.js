import { describe, it, expect } from 'vitest';
import {
  fixtureToAgendaItem, isUpcomingEvent, mergeAgenda, formatEventTime, localDateKey,
} from '../../utils/agendaItems';

const NOW = new Date(2026, 10, 6, 20, 0); // 6 nov 2026, 20:00 hora local

describe('isUpcomingEvent', () => {
  it('descarta entrenos de fechas pasadas', () => {
    expect(isUpcomingEvent({ date: '2026-09-29', time: '19:00:00' }, NOW)).toBe(false);
  });

  it('mantiene un evento de hoy hasta 3 horas después de empezar', () => {
    expect(isUpcomingEvent({ date: '2026-11-06', time: '18:00:00' }, NOW)).toBe(true);
    expect(isUpcomingEvent({ date: '2026-11-06', time: '16:30' }, NOW)).toBe(false);
  });

  it('un evento sin hora cuenta durante todo su día', () => {
    expect(isUpcomingEvent({ date: '2026-11-06', time: null }, NOW)).toBe(true);
    expect(isUpcomingEvent({ date: '2026-11-05', time: null }, NOW)).toBe(false);
  });

  it('acepta eventos futuros', () => {
    expect(isUpcomingEvent({ date: '2026-11-13', time: '16:00:00' }, NOW)).toBe(true);
  });
});

describe('fixtureToAgendaItem', () => {
  it('convierte un partido programado en un partido de la agenda sin inventar datos', () => {
    const item = fixtureToAgendaItem({
      id: 'f1', opponent: 'Halcones', date: '2026-11-27', time: '18:00:00', location: '',
      teamCategory: 'orcos_masculina_mayor', teamId: 't1',
    });
    expect(item).toMatchObject({
      id: 'fixture-f1', fixtureId: 'f1', isFixture: true, isMatch: true, type: 'partido',
      title: 'Partido: Orcos vs Halcones', date: '2026-11-27', time: '18:00:00',
      teamCategory: 'orcos_masculina_mayor', teamId: 't1',
    });
    expect(item.location).toBe('');
  });
});

describe('mergeAgenda', () => {
  it('junta eventos y partidos ordenados por fecha y hora, eventos sin hora primero', () => {
    const merged = mergeAgenda(
      [{ id: 'e1', date: '2026-11-20', time: '19:30:00' }, { id: 'e2', date: '2026-11-20', time: null }],
      [{ id: 'f1', opponent: 'Cóndores', date: '2026-11-20', time: '17:00:00' }, { id: 'f2', opponent: 'Halcones', date: '2026-11-13', time: '16:00:00' }],
    );
    expect(merged.map(e => e.id)).toEqual(['fixture-f2', 'e2', 'fixture-f1', 'e1']);
  });

  it('tolera listas vacías o sin definir', () => {
    expect(mergeAgenda(undefined, null)).toEqual([]);
  });
});

describe('formatEventTime', () => {
  it('muestra la hora como HH:MM, sin segundos ni "PM" añadido', () => {
    expect(formatEventTime('20:30:00')).toBe('20:30');
    expect(formatEventTime('7:05')).toBe('07:05');
  });

  it('devuelve vacío si no hay hora', () => {
    expect(formatEventTime(null)).toBe('');
    expect(formatEventTime('')).toBe('');
  });
});

describe('localDateKey', () => {
  it('usa la fecha local, no la UTC (a las 22:00 en Colombia sigue siendo el mismo día)', () => {
    expect(localDateKey(new Date(2026, 10, 6, 22, 30))).toBe('2026-11-06');
  });
});
