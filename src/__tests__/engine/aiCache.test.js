import { describe, it, expect, beforeEach } from 'vitest';
import { CACHE_CONFIG } from '../../engine/aiConfig';
import { getCachedResponse, setCachedResponse, clearCache, getCacheStats } from '../../engine/aiCache';

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'cache_' + Math.abs(hash).toString(36);
}

describe('aiCache — getCachedResponse', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('retorna null si la cache esta vacia', () => {
    const result = getCachedResponse('pregunta', 'groq', 'general');
    expect(result).toBeNull();
  });

  it('cache hit devuelve respuesta almacenada', () => {
    setCachedResponse('como hacer un tackle', 'groq', 'general', 'Inclina el cuerpo, mira el muslo');
    const result = getCachedResponse('como hacer un tackle', 'groq', 'general');
    expect(result).toBe('Inclina el cuerpo, mira el muslo');
  });

  it('cache miss con pregunta diferente', () => {
    setCachedResponse('como hacer un tackle', 'groq', 'general', 'respuesta');
    const result = getCachedResponse('como patear conversion', 'groq', 'general');
    expect(result).toBeNull();
  });

  it('cache miss con modelo diferente', () => {
    setCachedResponse('pregunta', 'groq', 'general', 'respuesta');
    const result = getCachedResponse('pregunta', 'gemini', 'general');
    expect(result).toBeNull();
  });

  it('cache miss con modo diferente', () => {
    setCachedResponse('pregunta', 'groq', 'general', 'respuesta');
    const result = getCachedResponse('pregunta', 'groq', 'tactico');
    expect(result).toBeNull();
  });

  it('TTL expirado retorna null', () => {
    setCachedResponse('pregunta fresca', 'groq', 'general', 'respuesta fresca');
    const cacheKey = CACHE_CONFIG.storageKey;
    const key = hashString('groq:general:pregunta para expirar');
    const expiredEntry = [{
      key,
      question: 'pregunta para expirar',
      modelId: 'groq',
      mode: 'general',
      response: 'respuesta vieja',
      timestamp: Date.now() - (CACHE_CONFIG.ttlMinutes + 1) * 60 * 1000,
      lastAccess: Date.now() - (CACHE_CONFIG.ttlMinutes + 1) * 60 * 1000,
    }];
    localStorage.setItem(cacheKey, JSON.stringify(expiredEntry));

    const result = getCachedResponse('pregunta para expirar', 'groq', 'general');
    expect(result).toBeNull();
  });

  it('es case-insensitive en la pregunta', () => {
    setCachedResponse('Como Hacer Un Tackle', 'groq', 'general', 'respuesta');
    const result = getCachedResponse('como hacer un tackle', 'groq', 'general');
    expect(result).toBe('respuesta');
  });
});

describe('aiCache — setCachedResponse', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('guarda una entrada nueva en cache', () => {
    setCachedResponse('test pregunta', 'groq', 'general', 'test respuesta');
    expect(getCachedResponse('test pregunta', 'groq', 'general')).toBe('test respuesta');
  });

  it('reemplaza entrada existente con misma key', () => {
    setCachedResponse('test', 'groq', 'general', 'v1');
    setCachedResponse('test', 'groq', 'general', 'v2');
    expect(getCachedResponse('test', 'groq', 'general')).toBe('v2');
  });
});

describe('aiCache — clearCache', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('elimina todas las entradas', () => {
    setCachedResponse('q1', 'groq', 'general', 'a1');
    setCachedResponse('q2', 'groq', 'general', 'a2');

    clearCache();

    expect(getCachedResponse('q1', 'groq', 'general')).toBeNull();
    expect(getCachedResponse('q2', 'groq', 'general')).toBeNull();
  });
});

describe('aiCache — getCacheStats', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stats de cache vacia', () => {
    const stats = getCacheStats();
    expect(stats.entries).toBe(0);
    expect(stats.oldestEntry).toBeNull();
  });

  it('stats de cache con entradas', () => {
    setCachedResponse('q1', 'groq', 'general', 'a1');
    setCachedResponse('q2', 'groq', 'general', 'a2');

    const stats = getCacheStats();
    expect(stats.entries).toBe(2);
    expect(stats.oldestEntry).toBeInstanceOf(Date);
  });
});
