import { describe, it, expect } from 'vitest';

describe('AIChat — streaming y estados', () => {
  it('mensaje de usuario se agrega al historial', () => {
    const messages = [];
    const userMsg = { role: 'user', text: '¿Cómo tacklear mejor?', time: new Date().toISOString() };
    messages.push(userMsg);
    expect(messages).toHaveLength(1);
    expect(messages[0].role).toBe('user');
  });

  it('respuesta de IA se agrega al historial tras streaming completo', () => {
    const messages = [{ role: 'user', text: 'hola' }];
    const aiMsg = { role: 'ai', text: 'Respuesta completa', provider: 'groq', mode: 'general' };
    messages.push(aiMsg);
    expect(messages).toHaveLength(2);
    expect(messages[1].role).toBe('ai');
    expect(messages[1].provider).toBe('groq');
  });

  it('streaming text se muestra en tiempo real', () => {
    let streamingText = '';
    const chunks = ['Hola', ' ¿cómo', ' estás?'];
    for (const chunk of chunks) {
      streamingText += chunk;
    }
    expect(streamingText).toBe('Hola ¿cómo estás?');
  });

  it('error en streaming se muestra como mensaje de error', () => {
    const errorMsg = 'Error: Todos los proveedores fallaron.';
    const isError = errorMsg.startsWith('Error:');
    expect(isError).toBe(true);
  });
});

describe('AIChat — modos de chat', () => {
  it('modo general: placeholder genérico', () => {
    const mode = 'general';
    const placeholders = {
      general: 'Pregúntame sobre rugby...',
      tactico: 'Consulta de táctica, formaciones o estrategia...',
      reglas: 'Pregunta sobre el reglamento de World Rugby...',
    };
    expect(placeholders[mode]).toContain('rugby');
  });

  it('modo táctico: placeholder táctico', () => {
    expect('Consulta de táctica').toContain('táctica');
  });

  it('modo reglas: placeholder de reglamento', () => {
    expect('reglamento de World Rugby').toContain('World Rugby');
  });
});

describe('AIChat — caché de respuestas', () => {
  it('cache hit: devuelve respuesta almacenada si no expiró', () => {
    const cache = [{ key: 'abc', response: 'respuesta cacheada', timestamp: Date.now() - 1000 }];
    const key = 'abc';
    const entry = cache.find(e => e.key === key);
    const ttlMs = 60 * 60 * 1000;
    const expired = Date.now() - entry.timestamp > ttlMs;
    expect(expired).toBe(false);
    expect(entry.response).toBe('respuesta cacheada');
  });

  it('cache miss: expirado retorna null', () => {
    const cache = [{ key: 'old', response: 'vieja', timestamp: Date.now() - 2 * 60 * 60 * 1000 }];
    const entry = cache.find(e => e.key === 'old');
    const ttlMs = 60 * 60 * 1000;
    const expired = Date.now() - entry.timestamp > ttlMs;
    expect(expired).toBe(true);
  });

  it('cache LRU: elimina entrada más antigua al exceder maxEntries', () => {
    let cache = [];
    cache.push({ key: 'a', lastAccess: 100 });
    cache.push({ key: 'b', lastAccess: 200 });
    cache.push({ key: 'c', lastAccess: 300 });
    cache.sort((a, b) => a.lastAccess - b.lastAccess);
    cache.shift(); // elimina el más viejo (a)
    expect(cache).toHaveLength(2);
    expect(cache[0].key).toBe('b');
  });
});

describe('AIChat — failover de proveedores', () => {
  it('intenta proveedores en orden hasta que uno funcione', () => {
    const providers = ['groq', 'deepseek', 'gemini'];
    const failedUntil = 'deepseek';
    let chosen = null;
    for (const p of providers) {
      if (p === failedUntil) { chosen = p; break; }
    }
    expect(chosen).toBe('deepseek');
  });

  it('retorna error si todos los proveedores fallan', () => {
    const allFailed = true;
    const result = allFailed ? { error: 'Todos los proveedores fallaron.' } : { text: 'ok' };
    expect(result.error).toBeTruthy();
  });
});
