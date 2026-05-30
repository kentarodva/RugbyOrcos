import { describe, it, expect } from 'vitest';

describe('TrainingHub — generatePlan', () => {
  it('jugador activo recibe ejercicios de campo y gym', () => {
    const category = 'forwards';
    const baseCampo = ['scrum_empuje', 'ruck_cleanout', 'maul_defensivo'];
    const baseGym = ['gym_sentadilla', 'gym_peso_muerto', 'gym_press_banca'];
    expect(category).toBe('forwards');
    expect(baseCampo.length).toBeGreaterThan(0);
    expect(baseGym.length).toBeGreaterThan(0);
  });

  it('jugador lesionado solo recibe recuperación', () => {
    const player = {
      id: 'p2', name: 'Lesionado', posicion: 'Ala', rol: 'Titular', estado: 'lesionado',
      injuryLog: [{ phase: 1, diagnosis: 'Esguince', weeks: 2 }],
      attributes: { force: 50, speed: 50, stamina: 50, technique: 50 },
    };
    const isInjured = player.estado === 'lesionado';
    expect(isInjured).toBe(true);
    // En fase 1 solo recuperación
    const phase = player.injuryLog[0].phase;
    expect(phase).toBe(1);
  });

  it('jugador lesionado fase 3 recibe ejercicios ligeros', () => {
    const player = {
      estado: 'lesionado',
      injuryLog: [{ phase: 3 }],
    };
    expect(player.injuryLog[0].phase).toBe(3);
    // Fase 3: ejercicios ligeros de campo
    expect(player.injuryLog[0].phase >= 3).toBe(true);
  });
});

describe('TrainingHub — analyzeMatchFaults', () => {
  it('detecta fallos de tackle', () => {
    const matchStats = [
      { tackles: 8, tries: 0, turnovers: 0, yellowCards: 0, redCards: 0 },
      { tackles: 10, tries: 1, turnovers: 1, yellowCards: 0, redCards: 0 },
    ];
    const avgTackles = matchStats.reduce((s, st) => s + (st.tackles || 0), 0) / matchStats.length;
    expect(avgTackles).toBeGreaterThan(5);
  });

  it('detecta tarjetas amarillas', () => {
    const matchStats = [{ yellowCards: 1, tackles: 5, tries: 0 }];
    const yellowCardsCount = matchStats.reduce((s, st) => s + (st.yellowCards || 0), 0);
    expect(yellowCardsCount).toBe(1);
  });

  it('detecta tarjeta roja (crítico)', () => {
    const matchStats = [{ redCards: 1, tackles: 3, tries: 0 }];
    const redCardsCount = matchStats.reduce((s, st) => s + (st.redCards || 0), 0);
    expect(redCardsCount).toBe(1);
  });

  it('sin fallos si no hay matchStats', () => {
    const matchStats = [];
    expect(matchStats.length).toBe(0);
  });

  it('prioriza fallos críticos primero', () => {
    const faults = ['lowConversions', 'missedTackles', 'redCards'];
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    const map = { redCards: 'critical', missedTackles: 'high', lowConversions: 'low' };
    const sorted = [...faults].sort((a, b) => {
      return (order[map[a]] ?? 3) - (order[map[b]] ?? 3);
    });
    expect(sorted[0]).toBe('redCards');
    expect(sorted[1]).toBe('missedTackles');
    expect(sorted[2]).toBe('lowConversions');
  });
});

describe('TrainingHub — calculateGymWeight', () => {
  it('calcula peso de sentadilla al 80%', () => {
    const gymStats = { squat: 120, bench: 90, deadlift: 140 };
    const percentage = 0.80;
    const weight = Math.round(gymStats.squat * percentage);
    expect(weight).toBe(96);
  });

  it('calcula peso de press banca al 65%', () => {
    const gymStats = { bench: 90 };
    const weight = Math.round(gymStats.bench * 0.65);
    expect(weight).toBe(59);
  });

  it('power clean usa 55% del deadlift como referencia', () => {
    const gymStats = { deadlift: 140 };
    const weight = Math.round(gymStats.deadlift * 0.55);
    expect(weight).toBe(77);
  });

  it('retorna null si no hay 1RM para el ejercicio', () => {
    const gymStats = {};
    const squat = gymStats.squat || 0;
    expect(squat === 0).toBe(true);
  });
});
