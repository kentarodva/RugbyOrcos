import { describe, it, expect, vi, beforeEach } from 'vitest';

const FAULT_EXERCISE_MAP = {
  missedTackles: { label: 'Tackles fallados', corrective: ['tackle_tecnico', 'tackle_persecucion'], priority: 'critical', minMatches: 1 },
  lowTackleCount: { label: 'Pocos tackles', corrective: ['tackle_tecnico'], priority: 'high', minMatches: 2 },
  knockOns: { label: 'Knock-ons', corrective: ['pase_base', 'handling_presion'], priority: 'high', minMatches: 2 },
  lowTries: { label: 'Pocos tries', corrective: ['ataque_profundo'], priority: 'medium', minMatches: 2 },
  lowTurnovers: { label: 'Pocos turnovers', corrective: ['ruck_cleanout', 'defensa_linea'], priority: 'medium', minMatches: 2 },
  lowConversions: { label: 'Pocas conversiones', corrective: ['patada_tactica'], priority: 'medium', minMatches: 2 },
  yellowCards: { label: 'Tarjetas amarillas', corrective: ['disciplina'], priority: 'high', minMatches: 1 },
  redCards: { label: 'Tarjetas rojas', corrective: ['disciplina_intensiva'], priority: 'critical', minMatches: 1 },
  poorKicking: { label: 'Patada deficiente', corrective: ['patada_tactica', 'patada_precision'], priority: 'medium', minMatches: 2 },
  lowStamina: { label: 'Baja condición física', corrective: ['gym_sprint_resistido', 'intervalos'], priority: 'medium', minMatches: 2 },
  missedPenalties: { label: 'Penales fallados', corrective: ['patada_precision'], priority: 'high', minMatches: 2 },
  scrum_bajo: { label: 'Scrum bajo', corrective: ['scrum_empuje'], priority: 'medium', minMatches: 1 },
};

describe('FAULT_EXERCISE_MAP — integrity', () => {
  it('cada entrada tiene label, corrective, priority, minMatches', () => {
    Object.entries(FAULT_EXERCISE_MAP).forEach(([key, val]) => {
      expect(val.label).toBeDefined();
      expect(Array.isArray(val.corrective)).toBe(true);
      expect(val.corrective.length).toBeGreaterThan(0);
      expect(['critical', 'high', 'medium', 'low']).toContain(val.priority);
      expect(typeof val.minMatches).toBe('number');
      expect(val.minMatches).toBeGreaterThanOrEqual(1);
    });
  });

  it('critical entries tienen minMatches 1', () => {
    Object.entries(FAULT_EXERCISE_MAP).forEach(([key, val]) => {
      if (val.priority === 'critical') {
        expect(val.minMatches).toBe(1);
      }
    });
  });

  it('corrective exercises no están vacíos', () => {
    Object.values(FAULT_EXERCISE_MAP).forEach(val => {
      expect(val.corrective.length).toBeGreaterThan(0);
    });
  });
});
