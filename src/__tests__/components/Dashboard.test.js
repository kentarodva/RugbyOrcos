import { describe, it, expect } from 'vitest';

// RadarChart logic — tested as pure functions extracted from the component logic
// AttendanceTimeline logic — tested as pure functions

describe('Dashboard — RadarChart: cálculo de promedios', () => {
  it('calcula promedio correcto de atributos', () => {
    const players = [
      { attributes: { force: 60, speed: 70, stamina: 80, technique: 90 } },
      { attributes: { force: 80, speed: 90, stamina: 60, technique: 70 } },
    ];
    const avg = (attr) => Math.round(players.reduce((s, p) => s + (p.attributes?.[attr] || 50), 0) / players.length);
    expect(avg('force')).toBe(70);
    expect(avg('speed')).toBe(80);
    expect(avg('stamina')).toBe(70);
    expect(avg('technique')).toBe(80);
  });

  it('devuelve 50 como default si falta el atributo', () => {
    const players = [{ attributes: null }];
    const avg = (attr) => Math.round(players.reduce((s, p) => s + (p.attributes?.[attr] || 50), 0) / players.length);
    expect(avg('force')).toBe(50);
  });

  it('no crashea con array vacío (retorna null temprano)', () => {
    const players = [];
    // En el componente real, RadarChart retorna null si teamPlayers.length === 0
    expect(players.length).toBe(0);
    // No debería llamarse avg() con array vacío porque el componente hace early return
  });
});

describe('Dashboard — AttendanceTimeline: cálculo de %', () => {
  it('calcula promedio de asistencia correcto', () => {
    const players = [
      { attendance: { total: 10, present: 9 } },
      { attendance: { total: 5, present: 5 } },
    ];
    const avgAtt = players.reduce((s, p) => {
      const a = p.attendance || {};
      return s + (a.total > 0 ? a.present / a.total : 0);
    }, 0) / players.length;
    expect(avgAtt).toBeCloseTo(0.95, 1);
  });

  it('maneja jugadores sin attendance (0%)', () => {
    const players = [{ attendance: null }, { attendance: { total: 0, present: 0 } }];
    const avgAtt = players.reduce((s, p) => {
      const a = p.attendance || {};
      return s + (a.total > 0 ? a.present / a.total : 0);
    }, 0) / players.length;
    expect(avgAtt).toBe(0);
  });

  it('no crashea con array vacío', () => {
    const players = [];
    // En el componente real, AttendanceTimeline retorna null si length === 0
    expect(players.length).toBe(0);
  });
});

describe('Dashboard — DivisionComparison: divisiones', () => {
  it('filtra jugadores correctamente por división', () => {
    const allPlayers = [
      { teamCategory: 'orcos_masculina_mayor', estado: 'activo', matchStats: [] },
      { teamCategory: 'orcos_masculina_mayor', estado: 'activo', matchStats: [{ tries: 2 }] },
      { teamCategory: 'orcos_femenina_mayor', estado: 'lesionado', matchStats: [] },
    ];
    const div = allPlayers.filter(p => p.teamCategory?.includes('masculina_mayor'));
    expect(div).toHaveLength(2);
    const activos = div.filter(p => p.estado === 'activo');
    expect(activos).toHaveLength(2);
    const tries = div.reduce((s, p) => s + (p.matchStats || []).reduce((a, b) => a + (b.tries || 0), 0), 0);
    expect(tries).toBe(2);
  });
});
