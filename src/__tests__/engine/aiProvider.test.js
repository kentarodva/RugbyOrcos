import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  chat,
  generateTrainingPlan,
  getActiveProviderId,
  getConfiguredProviders,
  isAnyProviderConfigured,
  getRateLimitInfoForAll,
} from '../../engine/aiProvider';

vi.mock('../../data/clubSettings', () => ({
  getSetting: vi.fn((key) => {
    const settings = {
      ai_provider: 'auto',
      openrouter_key: 'sk-or-xxx',
      groq_key: '',
      deepseek_key: null,
      gemini_key: undefined,
    };
    return settings[key];
  }),
}));

vi.mock('../../engine/aiCache', () => ({
  getCachedResponse: vi.fn(() => null),
  setCachedResponse: vi.fn(),
}));

vi.mock('../../engine/promptBuilder', () => ({
  buildSystemPrompt: vi.fn(() => 'system prompt'),
  buildAITrainingPlanPrompt: vi.fn((player) => `plan prompt for ${player.nombre}`),
  buildTrainingEnrichmentPrompt: vi.fn(() => 'enrichment prompt'),
}));

vi.mock('../../engine/contentFilter', () => ({
  filterMessage: vi.fn(() => ({ allowed: true, score: 10 })),
  isValidRugbyExercise: vi.fn(() => true),
}));

vi.mock('../../engine/providers/openrouterProvider', () => ({
  isConfigured: vi.fn(() => true),
  call: vi.fn(() => Promise.resolve({ text: 'test response' })),
  getRateLimitInfo: vi.fn(() => ({ used: 1, limit: 50 })),
  incrementRateLimit: vi.fn(),
}));

vi.mock('../../engine/providers/groqProvider', () => ({
  isConfigured: vi.fn(() => false),
  call: vi.fn(() => Promise.reject(new Error('groq fails'))),
  getRateLimitInfo: vi.fn(() => ({ used: 0, limit: 30 })),
  incrementRateLimit: vi.fn(),
}));

vi.mock('../../engine/providers/deepseekProvider', () => ({
  isConfigured: vi.fn(() => false),
  call: vi.fn(() => Promise.reject(new Error('deepseek fails'))),
  getRateLimitInfo: vi.fn(() => ({ used: 0, limit: 30 })),
  incrementRateLimit: vi.fn(),
}));

vi.mock('../../engine/providers/geminiProvider', () => ({
  isConfigured: vi.fn(() => false),
  call: vi.fn(() => Promise.reject(new Error('gemini fails'))),
  getRateLimitInfo: vi.fn(() => ({ used: 0, limit: 30 })),
  incrementRateLimit: vi.fn(),
}));

describe('aiProvider — provider order', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('getActiveProviderId retorna "auto" por defecto', () => {
    expect(getActiveProviderId()).toBe('auto');
  });

  it('isAnyProviderConfigured retorna true cuando openrouter configurado', () => {
    expect(isAnyProviderConfigured()).toBe(true);
  });

  it('getConfiguredProviders incluye al menos openrouter', () => {
    const providers = getConfiguredProviders();
    expect(providers).toContain('openrouter');
  });
});

describe('aiProvider — chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna error si ningún provider configurado', async () => {
    const openrouterMod = await import('../../engine/providers/openrouterProvider');
    openrouterMod.isConfigured.mockReturnValueOnce(false);
    const { getSetting } = await import('../../data/clubSettings');
    getSetting.mockReturnValue(undefined);
    const result = await chat('test');
    expect(result.error).toBeDefined();
  });

  it('retorna respuesta de openrouter cuando está configurado', async () => {
    const result = await chat('test message', { player: { nombre: 'Juan' }, mode: 'chat' });
    expect(result).toHaveProperty('text', 'test response');
    expect(result).toHaveProperty('provider', 'openrouter');
  });

  it('rechaza mensaje bloqueado por contentFilter', async () => {
    const { filterMessage } = await import('../../engine/contentFilter');
    filterMessage.mockReturnValueOnce({ allowed: false, score: 0, reason: 'Tema prohibido' });
    const result = await chat('drogas');
    expect(result.error).toBe('Tema prohibido');
  });
});

describe('aiProvider — generateTrainingPlan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna plan cuando openrouter responde con JSON válido', async () => {
    const mod = await import('../../engine/providers/openrouterProvider');
    mod.call.mockResolvedValueOnce({
      text: JSON.stringify({
        plan: { ejercicios: [{ nombre: 'tackle tecnico', categoria: 'campo', series: 4, reps: 8 }] },
        justificacion: 'test',
      }),
    });

    const result = await generateTrainingPlan({ nombre: 'Juan', posicion: 'Pilar' });
    expect(result).toHaveProperty('plan');
    expect(result.plan.ejercicios).toHaveLength(1);
    expect(result.plan.ejercicios[0].nombre).toBe('tackle tecnico');
  });

  it('retorna null si openrouter falla', async () => {
    const mod = await import('../../engine/providers/openrouterProvider');
    mod.call.mockRejectedValueOnce(new Error('timeout'));
    const result = await generateTrainingPlan({ nombre: 'Juan' });
    expect(result).toBeNull();
  });
});

describe('aiProvider — rate limiting', () => {
  it('getRateLimitInfoForAll retorna info de todos los providers', () => {
    const info = getRateLimitInfoForAll();
    expect(info).toHaveProperty('openrouter');
    expect(info.openrouter).toHaveProperty('used');
    expect(info.openrouter).toHaveProperty('limit');
  });
});
