import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock variables compartidas ─────────────────────────
// mockLookup:  usado por maybeSingle en SELECT (getActivePlan)
// mockList:    usado por limit() al final de SELECT (listPlans)
// mockResolve: usado por maybeSingle en UPSERT/UPDATE (insert, completePlan, saveFeedback)
let mockLookup = { data: null, error: null };
let mockList = { data: null, error: null };
let mockResolve = { data: null, error: null };

vi.mock('../../supabaseClient.js', () => {
  const upsertResolve = () => Promise.resolve(mockResolve);
  const lookupResolve = () => Promise.resolve(mockLookup);
  function qb() {
    return {
      then: (cb) => cb(mockList),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(lookupResolve),
      single: vi.fn(lookupResolve),
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({
          maybeSingle: vi.fn(upsertResolve),
          single: vi.fn(upsertResolve),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            maybeSingle: vi.fn(upsertResolve),
            single: vi.fn(upsertResolve),
          })),
        })),
      })),
    };
  }
  return { supabase: { from: vi.fn(qb) } };
});

vi.mock('../../engine/assignmentEngine', () => ({
  generatePlan: vi.fn(() => ({
    playerName: 'Test',
    plan: { campo: [], gym: [], recuperacion: [] },
    matchFaults: [],
    isInjured: false,
  })),
}));

vi.mock('../../engine/aiProvider', () => ({
  generateTrainingPlan: vi.fn().mockResolvedValue(null),
}));

vi.mock('../../engine/planNormalizer', () => ({
  normalizeEngineOutput: vi.fn(plan => ({
    ...plan,
    plan: {
      campo: (plan.plan?.campo || []).map(e => ({ ...e, fromAI: false })),
      gym: (plan.plan?.gym || []).map(e => ({ ...e, fromAI: false })),
      recuperacion: (plan.plan?.recuperacion || []).map(e => ({ ...e, fromAI: false })),
    },
    fromAI: false,
  })),
  normalizeAIOutput: vi.fn((aiPlan) => ({
    ...aiPlan,
    plan: {
      campo: (aiPlan.plan?.campo || []).map(e => ({ ...e, fromAI: true })),
      gym: (aiPlan.plan?.gimnasio || aiPlan.plan?.gym || []).map(e => ({ ...e, fromAI: true })),
      recuperacion: (aiPlan.plan?.recuperacion || []).map(e => ({ ...e, fromAI: true })),
    },
    fromAI: true,
    enrichedByAI: true,
  })),
}));

// ── Imports after mocks ───────────────────────────────
const {
  getWeekStart,
  getActivePlan,
  getOrGeneratePlan,
  listPlans,
  completePlan,
  saveFeedback,
} = await import('../../engine/trainingPlanService.js');

describe('trainingPlanService — getWeekStart', () => {
  it('miércoles retorna lunes anterior', () => {
    const result = getWeekStart(new Date(2026, 5, 10)); // Jun 10 (Wed)
    expect(result).toBe('2026-06-08');
  });

  it('domingo retorna lunes anterior', () => {
    const result = getWeekStart(new Date(2026, 5, 7)); // Jun 7 (Sun)
    expect(result).toBe('2026-06-01');
  });

  it('lunes retorna el mismo día', () => {
    const result = getWeekStart(new Date(2026, 5, 8)); // Jun 8 (Mon)
    expect(result).toBe('2026-06-08');
  });

  it('martes retorna lunes de la misma semana', () => {
    const result = getWeekStart(new Date(2026, 5, 9)); // Jun 9 (Tue)
    expect(result).toBe('2026-06-08');
  });
});

describe('trainingPlanService — getActivePlan', () => {
  beforeEach(() => { mockLookup = { data: null, error: null }; });

  it('retorna null cuando supabase no encuentra plan', async () => {
    const result = await getActivePlan('player-1');
    expect(result).toBeNull();
  });

  it('retorna el plan cuando supabase encuentra uno', async () => {
    mockLookup = { data: { id: 'plan-1', player_id: 'player-1', status: 'active' }, error: null };
    const result = await getActivePlan('player-1');
    expect(result.id).toBe('plan-1');
  });
});

describe('trainingPlanService — getOrGeneratePlan', () => {
  beforeEach(() => {
    mockLookup = { data: null, error: null };
    mockResolve = { data: null, error: null };
  });

  it('retorna null si player es null', async () => {
    expect(await getOrGeneratePlan(null)).toBeNull();
  });

  it('retorna null si player.id no existe', async () => {
    expect(await getOrGeneratePlan({ name: 'Test' })).toBeNull();
  });

  it('retorna plan existente de BD con fromDB: true', async () => {
    mockLookup = {
      data: {
        id: 'plan-1', player_id: 'p1', week_start: '2026-06-08',
        source: 'engine', plan: { campo: [] }, ai_analysis: null,
        completion_rate: 0, status: 'active',
      },
      error: null,
    };
    const result = await getOrGeneratePlan({ id: 'p1', name: 'Juan', estado: 'activo' });
    expect(result.fromDB).toBe(true);
    expect(result.id).toBe('plan-1');
    expect(result.source).toBe('engine');
  });

  it('genera nuevo plan cuando no existe en BD', async () => {
    mockResolve = { data: { id: 'new-plan' }, error: null };
    const result = await getOrGeneratePlan({ id: 'p1', name: 'Juan', estado: 'activo' });
    expect(result).not.toBeNull();
    expect(result.source).toBe('engine');
    expect(result.fromDB).toBe(true);
  });

  it('usa IA cuando generateTrainingPlan retorna plan válido', async () => {
    const { generateTrainingPlan } = await import('../../engine/aiProvider');
    generateTrainingPlan.mockResolvedValueOnce({
      analisis: 'Buen estado',
      riesgos: [],
      metas: ['Mejorar'],
      recomendaciones: {},
      plan: { campo: [{ nombre: 'Tackle IA' }], gimnasio: [], recuperacion: [] },
    });

    mockResolve = { data: { id: 'ai-plan' }, error: null };
    const result = await getOrGeneratePlan({ id: 'p1', name: 'Juan', estado: 'activo' });
    expect(result.source).toBe('ai');
    expect(result.enrichedByAI).toBe(true);
    expect(result.aiAnalysis).toBe('Buen estado');
  });

  it('cae a engine si generateTrainingPlan falla', async () => {
    const { generateTrainingPlan } = await import('../../engine/aiProvider');
    generateTrainingPlan.mockRejectedValueOnce(new Error('API error'));

    mockResolve = { data: { id: 'engine-plan' }, error: null };
    const result = await getOrGeneratePlan({ id: 'p1', name: 'Juan', estado: 'activo' });
    expect(result.source).toBe('engine');
  });

  it('detecta jugador lesionado', async () => {
    mockResolve = { data: { id: 'plan' }, error: null };
    const result = await getOrGeneratePlan({ id: 'p1', name: 'Juan', estado: 'lesionado' });
    expect(result.isInjured).toBe(true);
  });
});

describe('trainingPlanService — listPlans', () => {
  beforeEach(() => { mockList = { data: null, error: null }; });

  it('retorna array vacío cuando no hay datos', async () => {
    mockList = { data: null, error: null };
    const result = await listPlans('p1');
    expect(result).toEqual([]);
  });

  it('retorna planes ordenados por week_start desc, limit 12', async () => {
    mockList = {
      data: [
        { id: 'p1', week_start: '2026-06-15' },
        { id: 'p2', week_start: '2026-06-08' },
      ],
      error: null,
    };
    const result = await listPlans('p1');
    expect(result).toHaveLength(2);
    expect(result[0].week_start).toBe('2026-06-15');
  });
});

describe('trainingPlanService — completePlan', () => {
  beforeEach(() => { mockResolve = { data: null, error: null }; });

  it('marca plan como completed y guarda feedback', async () => {
    mockResolve = { data: { id: 'plan-1', status: 'completed', feedback: { rating: 4 } }, error: null };
    const result = await completePlan('plan-1', { rating: 4 });
    expect(result.status).toBe('completed');
    expect(result.feedback.rating).toBe(4);
  });

  it('funciona sin feedback (default {})', async () => {
    mockResolve = { data: { id: 'plan-1', status: 'completed', feedback: {} }, error: null };
    const result = await completePlan('plan-1');
    expect(result.status).toBe('completed');
  });
});

describe('trainingPlanService — saveFeedback', () => {
  beforeEach(() => { mockResolve = { data: null, error: null }; });

  it('actualiza feedback del plan', async () => {
    mockResolve = { data: { id: 'plan-1', feedback: { comment: 'Muy intenso' } }, error: null };
    const result = await saveFeedback('plan-1', { comment: 'Muy intenso' });
    expect(result.feedback.comment).toBe('Muy intenso');
  });
});
