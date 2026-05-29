import { CACHE_CONFIG } from './aiConfig';

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'cache_' + Math.abs(hash).toString(36);
}

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_CONFIG.storageKey);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data;
  } catch {
    return [];
  }
}

function saveCache(entries) {
  try {
    localStorage.setItem(CACHE_CONFIG.storageKey, JSON.stringify(entries));
  } catch {
    // localStorage lleno, limpiar caché antiguo
    const half = entries.slice(-Math.floor(CACHE_CONFIG.maxEntries / 2));
    localStorage.setItem(CACHE_CONFIG.storageKey, JSON.stringify(half));
  }
}

function getCacheKey(question, modelId, mode) {
  const normalized = question.toLowerCase().trim().replace(/\s+/g, ' ');
  return hashString(`${modelId}:${mode}:${normalized}`);
}

export function getCachedResponse(question, modelId, mode) {
  const key = getCacheKey(question, modelId, mode);
  const now = Date.now();
  const cache = loadCache();

  const entry = cache.find(e => e.key === key);
  if (!entry) return null;

  const ttlMs = CACHE_CONFIG.ttlMinutes * 60 * 1000;
  if (now - entry.timestamp > ttlMs) return null;

  entry.lastAccess = now;
  saveCache(cache);

  return entry.response;
}

export function setCachedResponse(question, modelId, mode, response) {
  const key = getCacheKey(question, modelId, mode);
  const now = Date.now();
  let cache = loadCache();

  cache = cache.filter(e => e.key !== key);

  cache.push({
    key,
    question: question.trim(),
    modelId,
    mode,
    response,
    timestamp: now,
    lastAccess: now
  });

  while (cache.length > CACHE_CONFIG.maxEntries) {
    cache.sort((a, b) => a.lastAccess - b.lastAccess);
    cache.shift();
  }

  saveCache(cache);
}

export function clearCache() {
  localStorage.removeItem(CACHE_CONFIG.storageKey);
}

export function getCacheStats() {
  const cache = loadCache();
  return {
    entries: cache.length,
    maxEntries: CACHE_CONFIG.maxEntries,
    oldestEntry: cache.length > 0
      ? new Date(Math.min(...cache.map(e => e.timestamp)))
      : null
  };
}
