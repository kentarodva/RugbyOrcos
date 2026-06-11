import { CACHE_CONFIG } from './aiConfig';

const cache = new Map();

function getCacheKey(question, modelId, mode) {
  const normalized = question.toLowerCase().trim().replace(/\s+/g, ' ');
  let hash = 0;
  const str = `${modelId}:${mode}:${normalized}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'cache_' + Math.abs(hash).toString(36);
}

export function getCachedResponse(question, modelId, mode) {
  const key = getCacheKey(question, modelId, mode);
  const entry = cache.get(key);
  if (!entry) return null;

  const ttlMs = CACHE_CONFIG.ttlMinutes * 60 * 1000;
  if (Date.now() - entry.timestamp > ttlMs) {
    cache.delete(key);
    return null;
  }

  entry.lastAccess = Date.now();
  return entry.response;
}

export function setCachedResponse(question, modelId, mode, response) {
  const key = getCacheKey(question, modelId, mode);

  cache.set(key, {
    key,
    question: question.trim(),
    modelId,
    mode,
    response,
    timestamp: Date.now(),
    lastAccess: Date.now()
  });

  while (cache.size > CACHE_CONFIG.maxEntries) {
    let oldestKey = null;
    let oldestTime = Infinity;
    for (const [k, e] of cache) {
      if (e.lastAccess < oldestTime) {
        oldestTime = e.lastAccess;
        oldestKey = k;
      }
    }
    if (oldestKey) cache.delete(oldestKey);
  }
}

export function clearCache() {
  cache.clear();
}

export function getCacheStats() {
  let oldestEntry = null;
  for (const [, e] of cache) {
    if (!oldestEntry || e.timestamp < oldestEntry) {
      oldestEntry = new Date(e.timestamp);
    }
  }
  return {
    entries: cache.size,
    maxEntries: CACHE_CONFIG.maxEntries,
    oldestEntry
  };
}
