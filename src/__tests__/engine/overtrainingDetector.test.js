import { describe, it, expect } from 'vitest';
import { detectOvertraining, getTeamOvertrainingRisk } from '../../engine/overtrainingDetector';

describe('detectOvertraining', () => {
  it('retorna null si no hay player', () => {
    expect(detectOvertraining(null)).toBeNull();
  });

  it('retorna null si no hay datos de riesgo', () => {
    const player = { wellnessLogs: [], workoutLog: [], injuryLog: [], estado: 'activo' };
    expect(detectOvertraining(player)).toBeNull();
  });

  it('detecta sueño bajo como riesgo', () => {
    const player = {
      wellnessLogs: [
        { sleep: 2, soreness: 2, stress: 2 },
        { sleep: 2, soreness: 2, stress: 2 },
        { sleep: 2, soreness: 2, stress: 2 },
      ],
      workoutLog: [],
      injuryLog: [],
      estado: 'activo',
    };
    const result = detectOvertraining(player);
    expect(result).not.toBeNull();
    expect(result.warnings.some(w => w.text.includes('Sueño'))).toBe(true);
  });

  it('detecta dolor alto como riesgo', () => {
    const player = {
      wellnessLogs: [
        { sleep: 4, soreness: 4, stress: 2 },
        { sleep: 4, soreness: 4, stress: 2 },
        { sleep: 4, soreness: 4, stress: 2 },
      ],
      workoutLog: [],
      injuryLog: [],
      estado: 'activo',
    };
    const result = detectOvertraining(player);
    expect(result).not.toBeNull();
    expect(result.warnings.some(w => w.text.toLowerCase().includes('dolor'))).toBe(true);
  });

  it('detecta combinacion sueño bajo + dolor alto como severidad alta', () => {
    const player = {
      wellnessLogs: [
        { sleep: 2, soreness: 4, stress: 3 },
        { sleep: 2, soreness: 4, stress: 3 },
        { sleep: 2, soreness: 4, stress: 3 },
      ],
      workoutLog: [],
      injuryLog: [],
      estado: 'activo',
    };
    const result = detectOvertraining(player);
    expect(result).not.toBeNull();
    expect(result.maxSeverity).toBe('alta');
    expect(result.warnings.some(w => w.severity === 'alta')).toBe(true);
  });

  it('detecta sesiones excesivas como riesgo', () => {
    const today = new Date();
    const dates = Array.from({ length: 5 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    });
    const player = {
      wellnessLogs: [
        { sleep: 4, soreness: 2, stress: 2 },
        { sleep: 4, soreness: 2, stress: 2 },
        { sleep: 4, soreness: 2, stress: 2 },
      ],
      workoutLog: dates.map(d => ({ date: d, ejercicios: [{ exerciseId: 'e1', completed: true }] })),
      injuryLog: [],
      estado: 'activo',
    };
    const result = detectOvertraining(player);
    expect(result).not.toBeNull();
  });

  it('detecta entrenamiento con lesión activa', () => {
    const today = new Date();
    const player = {
      wellnessLogs: [
        { sleep: 4, soreness: 2, stress: 2 },
        { sleep: 4, soreness: 2, stress: 2 },
        { sleep: 4, soreness: 2, stress: 2 },
      ],
      workoutLog: [
        { date: today.toISOString().split('T')[0], ejercicios: [] },
        { date: new Date(today.getTime() - 86400000).toISOString().split('T')[0], ejercicios: [] },
        { date: new Date(today.getTime() - 2 * 86400000).toISOString().split('T')[0], ejercicios: [] },
      ],
      injuryLog: [{ diagnosis: 'Lesión rodilla', date: '2026-05-01', weeks: 4, phase: 2 }],
      estado: 'lesionado',
    };
    const result = detectOvertraining(player);
    expect(result).not.toBeNull();
    expect(result.warnings.some(w => w.text.includes('lesión'))).toBe(true);
  });
});

describe('getTeamOvertrainingRisk', () => {
  it('retorna array vacío si no hay riesgos', () => {
    const players = [
      { id: 'p1', name: 'Player 1', wellnessLogs: [], workoutLog: [], injuryLog: [], estado: 'activo' },
    ];
    expect(getTeamOvertrainingRisk(players)).toEqual([]);
  });

  it('ordena por severidad (alta primero)', () => {
    const players = [
      {
        id: 'p1', name: 'Riesgo alto',
        wellnessLogs: [
          { sleep: 2, soreness: 4, stress: 3 },
          { sleep: 2, soreness: 4, stress: 3 },
          { sleep: 2, soreness: 4, stress: 3 },
        ],
        workoutLog: [],
        injuryLog: [],
        estado: 'activo',
      },
      {
        id: 'p2', name: 'Sin riesgo',
        wellnessLogs: [
          { sleep: 5, soreness: 1, stress: 1 },
          { sleep: 5, soreness: 1, stress: 1 },
          { sleep: 5, soreness: 1, stress: 1 },
        ],
        workoutLog: [],
        injuryLog: [],
        estado: 'activo',
      },
    ];
    const result = getTeamOvertrainingRisk(players);
    expect(result).toHaveLength(1);
    expect(result[0].playerName).toBe('Riesgo alto');
  });
});
