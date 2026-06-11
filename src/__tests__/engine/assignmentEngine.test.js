import { describe, it, expect } from 'vitest';
import { generatePlan } from '../../engine/assignmentEngine';

function makePlayer(overrides = {}) {
  return {
    id: 1,
    name: 'Test',
    posicion: 'Pilar',
    edad: 25,
    peso: 90,
    altura: 1.8,
    experiencia: 5,
    rendimiento: 80,
    estado: 'activo',
    matchFaults: undefined,
    matchStats: [],
    workoutLog: [],
    ...overrides,
  };
}

describe('generatePlan — selection logic', () => {
  it('retorna objeto con plan', () => {
    const result = generatePlan(makePlayer());
    expect(result).toHaveProperty('playerId');
    expect(result).toHaveProperty('plan');
    expect(result.plan).toHaveProperty('campo');
    expect(result.plan).toHaveProperty('gym');
    expect(result.plan).toHaveProperty('recuperacion');
    expect(Array.isArray(result.plan.campo)).toBe(true);
    expect(Array.isArray(result.plan.gym)).toBe(true);
    expect(result.plan.campo.length).toBeGreaterThan(0);
  });

  it('asigna ejercicios forwards a Pilar', () => {
    const result = generatePlan(makePlayer({ id: 1, posicion: 'Pilar' }));
    const names = result.plan.campo.map(e => e.id);
    expect(names).toContain('scrum_empuje');
  });

  it('asigna ejercicios backs a Ala', () => {
    const result = generatePlan(makePlayer({ id: 2, posicion: 'Ala' }));
    const names = result.plan.campo.map(e => e.id);
    expect(names).toContain('pase_base');
  });

  it('asigna liderazgo a Capitán', () => {
    const result = generatePlan(makePlayer({ id: 3, posicion: 'Segunda Línea', rol: 'Capitán' }));
    expect(result.category).toBe('captain');
  });

  it('asigna coach a Entrenador', () => {
    const result = generatePlan(makePlayer({ id: 4, posicion: 'Entrenador', rol: 'Entrenador' }));
    expect(result.category).toBe('coach');
  });

  it('asigna recuperación a lesionado estado=lesionado', () => {
    const result = generatePlan(makePlayer({ id: 5, posicion: 'Pilar', estado: 'lesionado', injuryLog: [{ phase: 1 }] }));
    const campoIds = result.plan.campo.map(e => e.id);
    const recIds = result.plan.recuperacion.map(e => e.id);
    expect(result.isInjured).toBe(true);
    expect(recIds).toContain('rec_foam_roller');
    expect(campoIds.length).toBe(0);
  });

  it('lesionado fase 2 recibe prevención', () => {
    const result = generatePlan(makePlayer({ id: 6, posicion: 'Pilar', estado: 'lesionado', injuryLog: [{ phase: 2 }] }));
    const recIds = result.plan.recuperacion.map(e => e.id);
    expect(recIds).toContain('prev_hombros');
  });

  it('lesionado fase 3 recibe campo ligero', () => {
    const result = generatePlan(makePlayer({ id: 7, posicion: 'Pilar', estado: 'lesionado', injuryLog: [{ phase: 3 }] }));
    expect(result.plan.campo.length).toBeGreaterThan(0);
  });

  it('no lesionado recibe prevención en recuperacion', () => {
    const result = generatePlan(makePlayer({ id: 8, posicion: 'Pilar' }));
    const recIds = result.plan.recuperacion.map(e => e.id);
    expect(recIds).toContain('rec_foam_roller');
    expect(recIds).toContain('rec_estiramiento');
  });

  it('asigna ejercicios de fault cuando matchStats presente', () => {
    const result = generatePlan(makePlayer({ id: 9, posicion: 'Pilar', matchStats: [{ tackles: 2 }] }));
    expect(result.matchFaults).toBeDefined();
    expect(Array.isArray(result.matchFaults)).toBe(true);
  });

  it('category es forwards o backs según posicion', () => {
    const fwd = generatePlan(makePlayer({ id: 10, posicion: 'Talonador' }));
    expect(fwd.category).toBe('forwards');
    const bck = generatePlan(makePlayer({ id: 11, posicion: 'Apertura' }));
    expect(bck.category).toBe('backs');
  });

  it('posicion desconocida cae en backs por defecto', () => {
    const result = generatePlan(makePlayer({ id: 12, posicion: 'Portero' }));
    expect(result.category).toBe('backs');
  });
});

describe('generatePlan — edge cases', () => {
  it('retorna matchFaults vacío sin matchStats', () => {
    const result = generatePlan(makePlayer());
    expect(result.matchFaults).toEqual([]);
  });

  it('retorna matchFaults vacío con matchStats vacío', () => {
    const result = generatePlan(makePlayer({ matchStats: [] }));
    expect(result.matchFaults).toEqual([]);
  });

  it('incluye generatedAt', () => {
    const result = generatePlan(makePlayer());
    expect(result.generatedAt).toBeDefined();
  });

  it('gym tiene calculo de peso cuando hay gymStats', () => {
    const result = generatePlan(makePlayer({ gymStats: { squat: 100, bench: 80, deadlift: 120 } }));
    result.plan.gym.forEach(ex => {
      if (ex.oneRMWeight) {
        expect(typeof ex.oneRMWeight).toBe('number');
        expect(ex.loadPercentage).toContain('1RM');
      }
    });
  });
});

describe('generatePlan — uniqueness', () => {
  it('genera planes con diferentes ejercicios para distintas posiciones', () => {
    const p1 = generatePlan(makePlayer({ id: 13, posicion: 'Pilar' }));
    const p2 = generatePlan(makePlayer({ id: 14, posicion: 'Ala' }));
    const n1 = p1.plan.campo.map(e => e.id).join(',');
    const n2 = p2.plan.campo.map(e => e.id).join(',');
    expect(n1).not.toBe(n2);
  });
});
