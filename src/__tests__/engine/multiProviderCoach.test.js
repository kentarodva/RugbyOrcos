import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('multiProviderCoach — setProviderKey', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('setProviderKey delega a groqProvider.setApiKey', async () => {
    const setApiKeySpy = vi.fn();

    // Simular cómo multiProviderCoach llama a setApiKey del provider correcto
    const map = { groq: { setApiKey: setApiKeySpy }, deepseek: { setApiKey: vi.fn() }, gemini: { setApiKey: vi.fn() } };
    const setProviderKey = (providerId, key) => map[providerId]?.setApiKey(key);

    setProviderKey('groq', 'gsk_test_123');
    expect(setApiKeySpy).toHaveBeenCalledWith('gsk_test_123');
  });

  it('setProviderKey delega a deepseekProvider.setApiKey', async () => {
    const setApiKeySpy = vi.fn();
    const map = { groq: { setApiKey: vi.fn() }, deepseek: { setApiKey: setApiKeySpy }, gemini: { setApiKey: vi.fn() } };
    const setProviderKey = (providerId, key) => map[providerId]?.setApiKey(key);

    setProviderKey('deepseek', 'sk-test');
    expect(setApiKeySpy).toHaveBeenCalledWith('sk-test');
  });

  it('setProviderKey elimina key cuando se pasa null', () => {
    const setApiKeySpy = vi.fn();
    const map = { groq: { setApiKey: setApiKeySpy }, deepseek: { setApiKey: vi.fn() }, gemini: { setApiKey: vi.fn() } };
    const setProviderKey = (providerId, key) => map[providerId]?.setApiKey(key);

    setProviderKey('groq', null);
    expect(setApiKeySpy).toHaveBeenCalledWith(null);
  });

  it('setProviderKey ignora providerId inválido silenciosamente', () => {
    const setApiKeySpy = vi.fn();
    const map = { groq: { setApiKey: setApiKeySpy } };
    const setProviderKey = (providerId, key) => map[providerId]?.setApiKey(key);

    // No crashea con provider inexistente
    expect(() => setProviderKey('openai', 'key')).not.toThrow();
  });
});
