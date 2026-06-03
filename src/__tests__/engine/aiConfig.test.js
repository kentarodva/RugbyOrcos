import { describe, it, expect } from 'vitest';
import {
  PROVIDERS, CACHE_CONFIG, RETRY_CONFIG, DEFAULT_PROVIDER_ORDER,
  CHAT_MODES, PROHIBITED_TOPICS, RUGBY_KEYWORDS_WEIGHTED,
} from '../../engine/aiConfig';

describe('aiConfig — PROVIDERS', () => {
  it('tiene 3 proveedores configurados', () => {
    expect(Object.keys(PROVIDERS)).toHaveLength(3);
    expect(PROVIDERS).toHaveProperty('groq');
    expect(PROVIDERS).toHaveProperty('deepseek');
    expect(PROVIDERS).toHaveProperty('gemini');
  });

  it('cada provider tiene campos requeridos', () => {
    Object.values(PROVIDERS).forEach(provider => {
      expect(provider).toHaveProperty('id');
      expect(provider).toHaveProperty('name');
      expect(provider).toHaveProperty('icon');
      expect(provider).toHaveProperty('desc');
      expect(provider).toHaveProperty('priority');
      expect(provider).toHaveProperty('apiKeyStorage');
      expect(provider).toHaveProperty('endpoint');
      expect(provider).toHaveProperty('models');
      expect(provider).toHaveProperty('defaultModel');
      expect(typeof provider.id).toBe('string');
      expect(typeof provider.name).toBe('string');
      expect(typeof provider.icon).toBe('string');
      expect(typeof provider.apiKeyStorage).toBe('string');
    });
  });

  it('groq tiene modelos llama3_70b y mixtral_8x7b', () => {
    expect(PROVIDERS.groq.models).toHaveProperty('llama3_70b');
    expect(PROVIDERS.groq.models).toHaveProperty('mixtral_8x7b');
    expect(PROVIDERS.groq.defaultModel).toBe('llama3_70b');
  });

  it('deepseek tiene el modelo deepseek_chat', () => {
    expect(PROVIDERS.deepseek.models).toHaveProperty('deepseek_chat');
  });

  it('gemini tiene el modelo flash', () => {
    expect(PROVIDERS.gemini.models).toHaveProperty('flash');
  });

  it('cada modelo tiene campos requeridos', () => {
    Object.values(PROVIDERS).forEach(provider => {
      Object.values(provider.models).forEach(model => {
        expect(model).toHaveProperty('id');
        expect(model).toHaveProperty('label');
        expect(model).toHaveProperty('icon');
        expect(model).toHaveProperty('desc');
        expect(model).toHaveProperty('maxTokens');
        expect(model).toHaveProperty('timeout');
        expect(model).toHaveProperty('dailyLimit');
        expect(model).toHaveProperty('temperature');
        expect(model.temperature).toHaveProperty('chat');
        expect(model.temperature).toHaveProperty('training');
        expect(model.temperature).toHaveProperty('analysis');
      });
    });
  });
});

describe('aiConfig — Configuraciones', () => {
  it('CACHE_CONFIG tiene valores esperados', () => {
    expect(CACHE_CONFIG.maxEntries).toBeGreaterThan(0);
    expect(CACHE_CONFIG.ttlMinutes).toBeGreaterThan(0);
    expect(CACHE_CONFIG.storageKey).toBeTruthy();
    expect(typeof CACHE_CONFIG.storageKey).toBe('string');
  });

  it('RETRY_CONFIG tiene valores esperados', () => {
    expect(RETRY_CONFIG.maxRetries).toBeGreaterThan(0);
    expect(RETRY_CONFIG.backoffMs).toBeInstanceOf(Array);
    expect(RETRY_CONFIG.backoffMs.length).toBeGreaterThan(0);
  });

  it('DEFAULT_PROVIDER_ORDER contiene los 3 providers', () => {
    expect(DEFAULT_PROVIDER_ORDER).toEqual(['groq', 'deepseek', 'gemini']);
  });

  it('CHAT_MODES tiene 3 modos', () => {
    expect(Object.keys(CHAT_MODES)).toHaveLength(3);
    expect(CHAT_MODES).toHaveProperty('general');
    expect(CHAT_MODES.general).toHaveProperty('label');
    expect(CHAT_MODES.general).toHaveProperty('placeholder');
  });

  it('PROHIBITED_TOPICS contiene terminos bloqueados', () => {
    expect(PROHIBITED_TOPICS.length).toBeGreaterThan(0);
    expect(PROHIBITED_TOPICS).toContain('drogas');
    expect(PROHIBITED_TOPICS).toContain('apuestas');
  });

  it('RUGBY_KEYWORDS_WEIGHTED contiene palabras con peso', () => {
    expect(RUGBY_KEYWORDS_WEIGHTED.length).toBeGreaterThan(50);
    RUGBY_KEYWORDS_WEIGHTED.forEach(kw => {
      expect(kw).toHaveProperty('word');
      expect(kw).toHaveProperty('weight');
      expect(typeof kw.word).toBe('string');
      expect(typeof kw.weight).toBe('number');
      expect(kw.weight).toBeGreaterThanOrEqual(1);
      expect(kw.weight).toBeLessThanOrEqual(3);
    });
  });
});
