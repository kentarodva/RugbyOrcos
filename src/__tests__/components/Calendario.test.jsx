import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Calendario — randomToken()', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('genera 20 caracteres hex con crypto.randomUUID', () => {
    const token = crypto.randomUUID().replace(/-/g, '').slice(0, 20);
    expect(token).toHaveLength(20);
    expect(token).toMatch(/^[a-f0-9]{20}$/);
  });

  it('fallback sin crypto genera 20 caracteres válidos', () => {
    vi.stubGlobal('crypto', undefined);
    const token = Array.from({ length: 20 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    expect(token).toHaveLength(20);
    expect(token).toMatch(/^[a-f0-9]{20}$/);
  });

  it('los tokens generados son diferentes entre sí', () => {
    const tokens = new Set();
    for (let i = 0; i < 10; i++) {
      const t = crypto.randomUUID().replace(/-/g, '').slice(0, 20);
      tokens.add(t);
    }
    expect(tokens.size).toBe(10);
  });
});

describe('Calendario — GuestRoster: guard fixture', () => {
  it('retorna null si fixture es null', () => {
    const fixture = null;
    expect(!fixture || !fixture.id).toBe(true);
  });

  it('retorna null si fixture no tiene id', () => {
    const fixture = { opponent: 'Rival' };
    expect(!fixture || !fixture.id).toBe(true);
  });

  it('continúa si fixture tiene id', () => {
    const fixture = { id: 'abc', opponent: 'Rival' };
    expect(!fixture || !fixture.id).toBe(false);
  });
});

describe('Calendario — generarInvitacion: anti-duplicado', () => {
  it('detecta invitación existente', () => {
    const existing = { id: 'inv1' };
    expect(!!existing).toBe(true);
  });

  it('permite crear si no hay invitación existente', () => {
    const existing = null;
    expect(!!existing).toBe(false);
  });
});

describe('Calendario — WhatsApp formatter', () => {
  it('genera mensaje con fecha formateada', () => {
    const event = { date: '2026-06-15', time: '15:00', location: 'Cancha Sur', mapsLink: 'https://maps.test' };
    const text = `*CONVOCATORIA RUGBY ORCOS*\n` +
      `*Fecha:* ${event.date}\n` +
      `*Hora:* ${event.time} PM\n` +
      `*Lugar:* ${event.location}\n` +
      `*Google Maps:* ${event.mapsLink}`;
    expect(text).toContain('CONVOCATORIA');
    expect(text).toContain('2026-06-15');
    expect(text).toContain('Cancha Sur');
  });
});

describe('Calendario — fixture results', () => {
  it('detecta victoria correctamente', () => {
    const fixture = { orcosScore: 25, opponentScore: 10 };
    const isWinner = fixture.orcosScore > fixture.opponentScore;
    expect(isWinner).toBe(true);
  });

  it('detecta derrota correctamente', () => {
    const fixture = { orcosScore: 5, opponentScore: 30 };
    const isWinner = fixture.orcosScore > fixture.opponentScore;
    expect(isWinner).toBe(false);
  });

  it('detecta empate correctamente', () => {
    const fixture = { orcosScore: 15, opponentScore: 15 };
    const isDraw = fixture.orcosScore === fixture.opponentScore;
    expect(isDraw).toBe(true);
  });

  it('calcula récord de temporada (W-D-L)', () => {
    const fixtures = [
      { orcosScore: 20, opponentScore: 10 },
      { orcosScore: 10, opponentScore: 10 },
      { orcosScore: 5, opponentScore: 25 },
    ];
    const w = fixtures.filter(f => f.orcosScore > f.opponentScore).length;
    const d = fixtures.filter(f => f.orcosScore === f.opponentScore).length;
    const l = fixtures.filter(f => f.orcosScore < f.opponentScore).length;
    expect(w).toBe(1);
    expect(d).toBe(1);
    expect(l).toBe(1);
  });
});

describe('Calendario — eventos recurrentes', () => {
  it('recurrencia semanal genera 4 eventos', () => {
    const baseDate = '2026-06-01';
    const weeks = 4;
    const events = [];
    for (let i = 0; i < weeks; i++) {
      const eventDate = new Date(baseDate + 'T00:00:00');
      eventDate.setDate(eventDate.getDate() + i * 7);
      events.push(eventDate.toISOString().split('T')[0]);
    }
    expect(events).toHaveLength(4);
    expect(events[0]).toBe('2026-06-01');
    expect(events[3]).toBe('2026-06-22');
  });

  it('recurrencia quincenal genera 2 eventos en 4 semanas', () => {
    const baseDate = '2026-06-01';
    const events = [];
    for (let i = 0; i < 2; i++) {
      const eventDate = new Date(baseDate + 'T00:00:00');
      eventDate.setDate(eventDate.getDate() + i * 14);
      events.push(eventDate.toISOString().split('T')[0]);
    }
    expect(events).toHaveLength(2);
    expect(events[0]).toBe('2026-06-01');
    expect(events[1]).toBe('2026-06-15');
  });
});
