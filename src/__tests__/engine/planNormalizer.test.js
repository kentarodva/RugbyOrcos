import { describe, it, expect } from 'vitest';
import { normalizeAIOutput, normalizeEngineOutput } from '../../engine/planNormalizer';

describe('planNormalizer — normalizeAIOutput', () => {
  it('retorna null si aiPlan es null', () => {
    expect(normalizeAIOutput(null, {})).toBeNull();
  });

  it('retorna null si aiPlan.plan es undefined', () => {
    expect(normalizeAIOutput({ analisis: 'test' }, {})).toBeNull();
  });

  it('normaliza ejercicios con nombres españoles a campos inglés', () => {
    const aiPlan = {
      analisis: 'Jugador necesita mejorar potencia',
      plan: {
        campo: [
          { nombre: 'Tackle progresivo', sets: '4x8', descripcion: 'Con saco', razon: 'Mejorar técnica' },
        ],
        gimnasio: [
          { nombre: 'Sentadilla', sets: '3x10', carga: '80%', descripcion: 'Barra alta', razon: 'Fuerza' },
        ],
        recuperacion: [
          { nombre: 'Estiramientos', duracion: '15 min', descripcion: 'Isquiotibiales' },
        ],
      },
    };
    const result = normalizeAIOutput(aiPlan, { gymStats: { squat: 100, bench: 80, deadlift: 120 } });
    expect(result).not.toBeNull();
    expect(result.fromAI).toBe(true);
    expect(result.enrichedByAI).toBe(true);
    expect(result.plan.campo).toHaveLength(1);
    expect(result.plan.gym).toHaveLength(1);
    expect(result.plan.recuperacion).toHaveLength(1);

    const campo = result.plan.campo[0];
    expect(campo.name).toBe('Tackle progresivo');
    expect(campo.sets).toBe(4);
    expect(campo.reps).toBe(8);
    expect(campo.aiReason).toBe('Mejorar técnica');
    expect(campo.drills).toEqual(['Con saco']);
    expect(campo.category).toBe('campo');
    expect(campo.fromAI).toBe(true);
    expect(campo.id).toMatch(/^ai_\d+_0$/);

    const gym = result.plan.gym[0];
    expect(gym.name).toBe('Sentadilla');
    expect(gym.loadPercentage).toBe('80%');
    expect(gym.category).toBe('gym');
  });

  it('normaliza gimnasio como gym cuando el input usa gym (inglés)', () => {
    const aiPlan = {
      plan: {
        campo: [],
        gym: [{ nombre: 'Press banca', sets: '3x10' }],
        recuperacion: [],
      },
    };
    const result = normalizeAIOutput(aiPlan, {});
    expect(result.plan.gym).toHaveLength(1);
    expect(result.plan.gym[0].name).toBe('Press banca');
  });

  it('categorías vacías retornan arrays vacíos', () => {
    const aiPlan = { plan: { campo: [], gimnasio: [], recuperacion: [] } };
    const result = normalizeAIOutput(aiPlan, {});
    expect(result.plan.campo).toEqual([]);
    expect(result.plan.gym).toEqual([]);
    expect(result.plan.recuperacion).toEqual([]);
  });

  it('ejercicio sin nombre ni nombre cae a "Ejercicio"', () => {
    const aiPlan = { plan: { campo: [{}], gimnasio: [], recuperacion: [] } };
    const result = normalizeAIOutput(aiPlan, {});
    expect(result.plan.campo[0].name).toBe('Ejercicio');
  });

  it('preserva analisis, riesgos, metas del aiPlan original', () => {
    const aiPlan = {
      analisis: 'Test análisis',
      riesgos: ['Riesgo 1'],
      metas: ['Meta 1'],
      recomendaciones: { sueno: 'Dormir más' },
      plan: { campo: [], gimnasio: [], recuperacion: [] },
    };
    const result = normalizeAIOutput(aiPlan, {});
    expect(result.analisis).toBe('Test análisis');
    expect(result.riesgos).toEqual(['Riesgo 1']);
    expect(result.metas).toEqual(['Meta 1']);
    expect(result.recomendaciones).toEqual({ sueno: 'Dormir más' });
  });

  it('parseSets: "3x10" → count 3, reps 10', () => {
    const result = normalizeAIOutput(
      { plan: { campo: [{ nombre: 'Test', sets: '3x10' }], gimnasio: [], recuperacion: [] } },
      {},
    );
    expect(result.plan.campo[0].sets).toBe(3);
    expect(result.plan.campo[0].reps).toBe(10);
  });

  it('parseSets: sin sets → count 3, reps 10', () => {
    const result = normalizeAIOutput(
      { plan: { campo: [{ nombre: 'Test' }], gimnasio: [], recuperacion: [] } },
      {},
    );
    expect(result.plan.campo[0].sets).toBe(3);
    expect(result.plan.campo[0].reps).toBe(10);
  });
});

describe('planNormalizer — normalizeEngineOutput', () => {
  it('retorna null si enginePlan es null', () => {
    expect(normalizeEngineOutput(null)).toBeNull();
  });

  it('retorna null si enginePlan.plan es undefined', () => {
    expect(normalizeEngineOutput({ playerName: 'Test' })).toBeNull();
  });

  it('marca each ejercicio como fromAI: false', () => {
    const enginePlan = {
      playerName: 'Juan',
      plan: {
        campo: [{ id: 'c1', name: 'Tackle' }],
        gym: [{ id: 'g1', name: 'Squat' }],
        recuperacion: [{ id: 'r1', name: 'Estirar' }],
      },
    };
    const result = normalizeEngineOutput(enginePlan);
    expect(result.fromAI).toBe(false);
    [...result.plan.campo, ...result.plan.gym, ...result.plan.recuperacion].forEach(ex => {
      expect(ex.fromAI).toBe(false);
    });
  });

  it('categorías faltantes se reemplazan con []', () => {
    const enginePlan = {
      plan: { campo: [{ id: 'c1' }] },
    };
    const result = normalizeEngineOutput(enginePlan);
    expect(result.plan.campo).toHaveLength(1);
    expect(result.plan.gym).toEqual([]);
    expect(result.plan.recuperacion).toEqual([]);
  });

  it('preserva playerName, matchFaults y otras props del enginePlan', () => {
    const enginePlan = {
      playerName: 'Juan',
      category: 'forwards',
      isInjured: false,
      matchFaults: ['tackle'],
      plan: { campo: [], gym: [], recuperacion: [] },
    };
    const result = normalizeEngineOutput(enginePlan);
    expect(result.playerName).toBe('Juan');
    expect(result.category).toBe('forwards');
    expect(result.isInjured).toBe(false);
    expect(result.matchFaults).toEqual(['tackle']);
  });
});

describe('planNormalizer — oneRM calculation', () => {
  it('gym con carga de sentadilla usa gymStats.squat', () => {
    const player = { gymStats: { squat: 120, bench: 90, deadlift: 140 } };
    const aiPlan = {
      plan: {
        campo: [],
        gimnasio: [{ nombre: 'Sentadilla', sets: '3x10', carga: '70% sentadilla' }],
        recuperacion: [],
      },
    };
    const result = normalizeAIOutput(aiPlan, player);
    expect(result.plan.gym[0].oneRMWeight).toBe(120);
  });

  it('categoría campo retorna null para oneRMWeight', () => {
    const result = normalizeAIOutput(
      { plan: { campo: [{ nombre: 'Sprint' }], gimnasio: [], recuperacion: [] } },
      { gymStats: { squat: 100 } },
    );
    expect(result.plan.campo[0].oneRMWeight).toBeNull();
  });

  it('gym con carga de banca usa gymStats.bench', () => {
    const player = { gymStats: { squat: 120, bench: 90, deadlift: 140 } };
    const aiPlan = {
      plan: { campo: [], gimnasio: [{ nombre: 'Press banca', carga: 'banca' }], recuperacion: [] },
    };
    const result = normalizeAIOutput(aiPlan, player);
    expect(result.plan.gym[0].oneRMWeight).toBe(90);
  });
});

describe('planNormalizer — drills parsing', () => {
  it('drills como string se divide por líneas', () => {
    const result = normalizeAIOutput(
      { plan: { campo: [{ nombre: 'Test', descripcion: 'Paso 1\n- Paso 2\n• Paso 3' }], gimnasio: [], recuperacion: [] } },
      {},
    );
    expect(result.plan.campo[0].drills).toEqual(['Paso 1', 'Paso 2', 'Paso 3']);
  });

  it('drills como array se pasa directamente', () => {
    const result = normalizeAIOutput(
      { plan: { campo: [{ nombre: 'Test', drills: ['Drill 1', 'Drill 2'] }], gimnasio: [], recuperacion: [] } },
      {},
    );
    expect(result.plan.campo[0].drills).toEqual(['Drill 1', 'Drill 2']);
  });

  it('drills undefined retorna array vacío', () => {
    const result = normalizeAIOutput(
      { plan: { campo: [{ nombre: 'Test' }], gimnasio: [], recuperacion: [] } },
      {},
    );
    expect(result.plan.campo[0].drills).toEqual([]);
  });
});
