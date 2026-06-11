import { describe, it, expect } from 'vitest';

describe('deepseekProvider', () => {
  it('exporta funciones esperadas', async () => {
    const mod = await import('../../../engine/providers/deepseekProvider');
    expect(typeof mod.isConfigured).toBe('function');
    expect(typeof mod.call).toBe('function');
    expect(typeof mod.streamChat).toBe('function');
    expect(typeof mod.getRateLimitInfo).toBe('function');
    expect(typeof mod.incrementRateLimit).toBe('function');
    expect(typeof mod.setApiKey).toBe('function');
    expect(typeof mod.getProviderInfo).toBe('function');
    expect(typeof mod.debugConnection).toBe('function');
  });

  it('isConfigured retorna booleano', async () => {
    const mod = await import('../../../engine/providers/deepseekProvider');
    expect(typeof mod.isConfigured()).toBe('boolean');
  });
});
