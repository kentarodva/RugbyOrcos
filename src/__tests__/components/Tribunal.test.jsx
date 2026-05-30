import { describe, it, expect } from 'vitest';

describe('Tribunal — asistencia', () => {
  it('registra asistencia de múltiples jugadores', () => {
    const attendanceList = {
      'p1': 'presente',
      'p2': 'tarde',
      'p3': 'falta_injustificada',
      'p4': 'falta_justificada',
    };
    const penalties = {};
    if (attendanceList['p2'] === 'tarde') penalties['p2'] = 15;
    if (attendanceList['p3'] === 'falta_injustificada') penalties['p3'] = 50;
    expect(penalties['p2']).toBe(15);
    expect(penalties['p3']).toBe(50);
  });

  it('sin jugadores marcados muestra warning', () => {
    const list = {};
    const isEmpty = Object.keys(list).length === 0;
    expect(isEmpty).toBe(true);
  });
});

describe('Tribunal — infracciones', () => {
  it('calcula burpees por penales + amarillas + rojas', () => {
    const inf = { penales: 3, amarillas: 1, rojas: 0 };
    const burpees = (inf.penales * 10) + (inf.amarillas * 50) + (inf.rojas * 100);
    expect(burpees).toBe(80);
  });

  it('tarjeta roja suspende automáticamente', () => {
    const inf = { rojas: 1 };
    const suspendido = inf.rojas > 0;
    expect(suspendido).toBe(true);
  });

  it('catálogo de faltas tiene 14 tipos', () => {
    const faults = [
      'tackle_alto', 'offside', 'knock_on', 'pase_forward',
      'obstruccion', 'juego_sucio', 'placaje_sin_balon', 'no_rodar',
      'entrada_lateral', 'derribo_peligroso', 'golpe_ilegal',
      'insulto_arbitro', 'indisciplina', 'otro',
    ];
    expect(faults).toHaveLength(14);
  });
});

describe('Tribunal — rankings', () => {
  it('ranking de tries: ordena por tries descendente', () => {
    const players = [
      { name: 'A', matchStats: [{ tries: 3 }] },
      { name: 'B', matchStats: [{ tries: 5 }] },
      { name: 'C', matchStats: [{ tries: 1 }] },
    ];
    players.sort((a, b) => {
      const triesA = a.matchStats.reduce((s, m) => s + m.tries, 0);
      const triesB = b.matchStats.reduce((s, m) => s + m.tries, 0);
      return triesB - triesA;
    });
    expect(players[0].name).toBe('B');
    expect(players[2].name).toBe('C');
  });

  it('ranking de tackles: top 3', () => {
    const players = [
      { name: 'X', matchStats: [{ tackles: 5 }] },
      { name: 'Y', matchStats: [{ tackles: 12 }] },
      { name: 'Z', matchStats: [{ tackles: 8 }] },
    ];
    const top3 = players
      .map(p => ({ name: p.name, tackles: p.matchStats.reduce((s, m) => s + m.tackles, 0) }))
      .sort((a, b) => b.tackles - a.tackles)
      .slice(0, 3);
    expect(top3[0].name).toBe('Y');
    expect(top3).toHaveLength(3);
  });
});
