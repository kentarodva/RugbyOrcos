import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createProvider } from '../../engine/providers/providerFactory';

describe('providerFactory — Fix #7: factory compartido', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('crea un provider para groq con todos los métodos', () => {
    const groq = createProvider('groq');
    expect(groq).toHaveProperty('isConfigured');
    expect(groq).toHaveProperty('getProviderInfo');
    expect(groq).toHaveProperty('setApiKey');
    expect(groq).toHaveProperty('getRateLimitInfo');
    expect(groq).toHaveProperty('incrementRateLimit');
    expect(groq).toHaveProperty('call');
    expect(groq).toHaveProperty('streamChat');
    expect(groq).toHaveProperty('debugConnection');
    expect(typeof groq.isConfigured).toBe('function');
    expect(typeof groq.call).toBe('function');
    expect(typeof groq.streamChat).toBe('function');
  });

  it('crea un provider para deepseek con los mismos métodos', () => {
    const ds = createProvider('deepseek');
    expect(ds).toHaveProperty('isConfigured');
    expect(ds).toHaveProperty('setApiKey');
    expect(ds).toHaveProperty('call');
    expect(ds).toHaveProperty('debugConnection');
  });

  it('isConfigured retorna false sin API key', () => {
    const groq = createProvider('groq');
    expect(groq.isConfigured()).toBe(false);
  });

  it('setApiKey guarda en localStorage la key correcta', () => {
    const groq = createProvider('groq');
    groq.setApiKey('gsk_test_key_123');
    expect(localStorage.getItem('orcos_groq_key')).toBe('gsk_test_key_123');
  });

  it('setApiKey(null) elimina la key', () => {
    const groq = createProvider('groq');
    groq.setApiKey('gsk_test');
    groq.setApiKey(null);
    expect(localStorage.getItem('orcos_groq_key')).toBeNull();
  });

  it('debugConnection retorna error sin API key', async () => {
    const groq = createProvider('groq');
    const result = await groq.debugConnection();
    expect(result.error).toBe(true);
  });
});

describe('providerFactory — Fix #12: rate limit atómico', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('incrementRateLimit actualiza localStorage correctamente', () => {
    const groq = createProvider('groq');
    const today = new Date().toISOString().split('T')[0];
    const key = `orcos_ai_rate_groq_llama3-70b-8192_${today}`;

    expect(Number(localStorage.getItem(key) || 0)).toBe(0);
    groq.incrementRateLimit();
    expect(Number(localStorage.getItem(key))).toBe(1);
    groq.incrementRateLimit();
    expect(Number(localStorage.getItem(key))).toBe(2);
  });

  it('getRateLimitInfo retorna contadores correctos tras incrementos', () => {
    const groq = createProvider('groq');
    groq.incrementRateLimit();
    const info = groq.getRateLimitInfo();
    expect(info.used).toBeGreaterThanOrEqual(1);
    expect(info.limit).toBeGreaterThan(0);
  });

  it('incrementRateLimit notifica via BroadcastChannel cuando está disponible', () => {
    const originalBC = global.BroadcastChannel;
    const postMessageSpy = vi.fn();
    const closeSpy = vi.fn();

    global.BroadcastChannel = vi.fn(function () {
      this.postMessage = postMessageSpy;
      this.close = closeSpy;
    });

    try {
      const groq = createProvider('groq');
      groq.incrementRateLimit();
      expect(postMessageSpy).toHaveBeenCalledTimes(1);
    } finally {
      global.BroadcastChannel = originalBC;
    }
  });
});
