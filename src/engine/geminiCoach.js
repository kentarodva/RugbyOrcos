import { chat, streamChat, enrichPlan, debugConnection, isAnyProviderConfigured, getConfiguredProviders, getRateLimitInfoForAll, getRateLimitInfo, getActiveProviderId, PROVIDERS, DEFAULT_PROVIDER_ORDER } from './aiProvider';
import { filterMessage, isValidRugbyExercise } from './contentFilter';
import { clearCache, getCacheStats } from './aiCache';

export function isRugbyRelated(text) {
  if (!text) return false;
  return filterMessage(text).allowed;
}

export { isValidRugbyExercise, clearCache, getCacheStats };

export function isGeminiConfigured() {
  return isAnyProviderConfigured();
}

export function getModelConfig() {
  const activeId = getActiveProviderId();
  const configured = getConfiguredProviders();
  const available = configured.map(id => ({
    id,
    ...PROVIDERS[id]
  }));
  return {
    current: activeId !== 'auto' ? PROVIDERS[activeId] : (PROVIDERS[configured[0]] || {}),
    activeProviderId: activeId,
    available
  };
}

export function setGeminiKey(key) {
  if (key) {
    localStorage.setItem('orcos_gemini_key', key.trim());
  } else {
    localStorage.removeItem('orcos_gemini_key');
  }
}

export function setSelectedModel(modelId) {
  if (PROVIDERS.gemini.models[modelId]) {
    localStorage.setItem('orcos_ai_model', modelId);
  }
}

export { getRateLimitInfo };
export { getRateLimitInfoForAll as getRateLimitInfoAll };

export async function chatWithGemini(question, context = {}) {
  return chat(question, context);
}

export async function streamChatWithGemini(prompt, onChunk, options = {}) {
  return streamChat(prompt, onChunk, { mode: options.mode || 'general' });
}

export async function enrichWithGemini(plan, player) {
  return enrichPlan(plan, player);
}

export async function debugGeminiConnection() {
  const configured = getConfiguredProviders();
  if (configured.length === 0) return { error: true, message: 'Ningún proveedor configurado.' };
  return debugConnection(configured[0]);
}

export { debugConnection as debugProviderConnection };
export { getActiveProviderId as getActiveProvider };
export { PROVIDERS };
export { DEFAULT_PROVIDER_ORDER };
