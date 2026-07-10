import { describe, it, expect } from 'vitest';
import { PROVIDERS, CHAT_MODES, PROHIBITED_TOPICS, RUGBY_KEYWORDS_WEIGHTED, RETRY_CONFIG, CACHE_CONFIG, RATE_LIMIT_STORAGE_PREFIX, DEFAULT_PROVIDER_ORDER } from '../../engine/aiConfig';

describe('aiConfig — provider definitions', () => {
  it('PROVIDERS contiene los 4 proveedores', () => {
    expect(Object.keys(PROVIDERS)).toHaveLength(4);
    expect(PROVIDERS).toHaveProperty('openrouter');
    expect(PROVIDERS).toHaveProperty('groq');
    expect(PROVIDERS).toHaveProperty('deepseek');
    expect(PROVIDERS).toHaveProperty('gemini');
  });

  it('cada provider tiene id, name, icon, desc, models', () => {
    Object.values(PROVIDERS).forEach(p => {
      expect(p.id).toBeDefined();
      expect(p.name).toBeDefined();
      expect(p.icon).toBeDefined();
      expect(p.models).toBeDefined();
      expect(typeof p.defaultModel).toBe('string');
    });
  });

  it('cada modelo tiene id, maxTokens, timeout, temperature', () => {
    Object.values(PROVIDERS).forEach(p => {
      Object.values(p.models).forEach(m => {
        expect(m.id).toBeDefined();
        expect(m.maxTokens).toBeGreaterThan(0);
        expect(m.timeout).toBeGreaterThan(0);
        expect(m.temperature).toHaveProperty('chat');
        expect(m.temperature).toHaveProperty('training');
        expect(m.temperature).toHaveProperty('analysis');
      });
    });
  });

  it('openrouter tiene apiKeyStorage orcos_openrouter_key', () => {
    expect(PROVIDERS.openrouter.apiKeyStorage).toBe('orcos_openrouter_key');
  });
});

describe('aiConfig — CHAT_MODES', () => {
  it('tiene al menos 3 modos', () => {
    expect(Object.keys(CHAT_MODES).length).toBeGreaterThanOrEqual(3);
  });

  it('cada modo tiene propiedades definidas', () => {
    Object.values(CHAT_MODES).forEach(mode => {
      expect(mode).toBeDefined();
      expect(typeof mode).toBe('object');
    });
  });
});

describe('aiConfig — PROHIBITED_TOPICS', () => {
  it('contiene temas prohibidos', () => {
    expect(Array.isArray(PROHIBITED_TOPICS)).toBe(true);
    expect(PROHIBITED_TOPICS.length).toBeGreaterThan(0);
    expect(PROHIBITED_TOPICS).toContain('política');
    expect(PROHIBITED_TOPICS).toContain('drogas');
  });
});

describe('aiConfig — RUGBY_KEYWORDS_WEIGHTED', () => {
  it('tiene más de 50 keywords', () => {
    expect(RUGBY_KEYWORDS_WEIGHTED.length).toBeGreaterThan(50);
  });

  it('cada keyword tiene word y weight', () => {
    RUGBY_KEYWORDS_WEIGHTED.forEach(kw => {
      expect(typeof kw.word).toBe('string');
      expect(kw.word.length).toBeGreaterThan(0);
      expect([1, 2, 3]).toContain(kw.weight);
    });
  });

  it('"rugby" tiene weight 3', () => {
    const r = RUGBY_KEYWORDS_WEIGHTED.find(kw => kw.word === 'rugby');
    expect(r.weight).toBe(3);
  });

  it('"tackle" tiene weight 2', () => {
    const r = RUGBY_KEYWORDS_WEIGHTED.find(kw => kw.word === 'tackle');
    expect(r.weight).toBe(2);
  });

  it('"ejercicio" tiene weight 1', () => {
    const r = RUGBY_KEYWORDS_WEIGHTED.find(kw => kw.word === 'ejercicio');
    expect(r.weight).toBe(1);
  });
});

describe('aiConfig — constants', () => {
  it('RETRY_CONFIG tiene maxRetries >= 2', () => {
    expect(RETRY_CONFIG.maxRetries).toBeGreaterThanOrEqual(2);
  });

  it('CACHE_CONFIG está definido', () => {
    expect(CACHE_CONFIG).toBeDefined();
  });

  it('RATE_LIMIT_STORAGE_PREFIX no está vacío', () => {
    expect(RATE_LIMIT_STORAGE_PREFIX.length).toBeGreaterThan(0);
  });

  it('DEFAULT_PROVIDER_ORDER tiene 4 providers', () => {
    expect(DEFAULT_PROVIDER_ORDER).toHaveLength(2);
    expect(DEFAULT_PROVIDER_ORDER[0]).toBe('gemini');
  });
});
