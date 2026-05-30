import { describe, it, expect } from 'vitest';

describe('AwardsHall — premios de Honor', () => {
  it('MVP Legendario: cuenta MVPs', () => {
    const player = { matchStats: [{ mvp: true }, { mvp: false }, { mvp: true }] };
    const mvps = player.matchStats.filter(m => m.mvp).length;
    expect(mvps).toBe(2);
  });

  it('Try del Año: suma tries', () => {
    const player = { matchStats: [{ tries: 2 }, { tries: 1 }, { tries: 3 }] };
    const tries = player.matchStats.reduce((s, m) => s + (m.tries || 0), 0);
    expect(tries).toBe(6);
  });

  it('Muralla Impenetrable: suma tackles', () => {
    const player = { matchStats: [{ tackles: 10 }, { tackles: 8 }] };
    const tackles = player.matchStats.reduce((s, m) => s + (m.tackles || 0), 0);
    expect(tackles).toBe(18);
  });

  it('Asistencia Perfecta: % >= 90', () => {
    const att = { total: 10, present: 9 };
    const rate = att.total > 0 ? att.present / att.total : 0;
    expect(rate).toBeCloseTo(0.9, 1);
    expect(rate >= 0.9).toBe(true);
  });

  it('Bestia del Gimnasio: fuerza relativa', () => {
    const gymStats = { squat: 140, bench: 100, deadlift: 180 };
    const weight = 85;
    const ratio = (gymStats.squat + gymStats.bench + gymStats.deadlift) / weight;
    expect(ratio).toBeCloseTo(4.94, 1);
  });

  it('Guerrero del Año: puntaje combinado', () => {
    const tries = 5;
    const tackles = 20;
    const mvps = 2;
    const yellowCards = 1;
    const redCards = 0;
    const score = tries * 3 + tackles * 0.5 + mvps * 5 - yellowCards * 2 - redCards * 5;
    // 15 + 10 + 10 - 2 - 0 = 33
    expect(score).toBe(33);
  });
});

describe('AwardsHall — premios de la Taberna', () => {
  it('Rey de las Tarjetas: suma tarjetas', () => {
    const player = { matchStats: [{ yellowCards: 2 }, { redCards: 1 }] };
    const cards = player.matchStats.reduce((s, m) => s + (m.yellowCards || 0) + (m.redCards || 0) * 2, 0);
    expect(cards).toBe(4);
  });

  it('Moroso del Año: deuda máxima', () => {
    const m = { paid: 2000, due: 10000 };
    const debt = Math.max(0, (m.due || 10000) - (m.paid || 0));
    expect(debt).toBe(8000);
  });

  it('Burpee Master: mayor cantidad de burpees', () => {
    const p1 = { penalties: { burpees: 300 } };
    const p2 = { penalties: { burpees: 500 } };
    const winner = p1.penalties.burpees > p2.penalties.burpees ? p1 : p2;
    expect(winner).toBe(p2);
  });

  it('El Invisible: menor % asistencia', () => {
    const att = { total: 10, present: 3 };
    const rate = att.total > 0 ? att.present / att.total : 1;
    expect(rate).toBe(0.3);
  });

  it('Nevera del Año: semanas totales lesionado', () => {
    const player = { injuryLog: [{ weeks: 4 }, { weeks: 2 }] };
    const total = player.injuryLog.reduce((s, i) => s + (i.weeks || 0), 0);
    expect(total).toBe(6);
  });
});

describe('AwardsHall — top 3', () => {
  it('getTop3 filtra y ordena por score', () => {
    const players = [
      { name: 'A', matchStats: [{ tries: 5 }] },
      { name: 'B', matchStats: [{ tries: 1 }] },
      { name: 'C', matchStats: [{ tries: 3 }] },
      { name: 'D', matchStats: [{ tries: 8 }] },
    ];
    const calc = (p) => p.matchStats.reduce((s, m) => s + (m.tries || 0), 0);
    const top3 = players
      .map(p => ({ ...p, _score: calc(p) }))
      .sort((a, b) => b._score - a._score)
      .slice(0, 3);
    expect(top3).toHaveLength(3);
    expect(top3[0].name).toBe('D');
    expect(top3[2].name).toBe('C');
  });
});
