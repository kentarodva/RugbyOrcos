// ── Multi-Provider AI Coach (Groq / DeepSeek / Gemini) ──
// Fachada unificada sobre todos los proveedores de IA.
import { chat, streamChat, enrichPlan, debugConnection, generateTrainingPlan, isAnyProviderConfigured, getConfiguredProviders, getRateLimitInfoForAll, getRateLimitInfo, getActiveProviderId, PROVIDERS, DEFAULT_PROVIDER_ORDER } from './aiProvider';
import { filterMessage, isValidRugbyExercise } from './contentFilter';
import { clearCache, getCacheStats } from './aiCache';
import { saveSetting } from '../data/clubSettings';
import * as openrouterProvider from './providers/openrouterProvider';
import * as groqProvider from './providers/groqProvider';
import * as deepseekProvider from './providers/deepseekProvider';
import * as geminiProvider from './providers/geminiProvider';

export function isRugbyRelated(text) {
  if (!text) return false;
  return filterMessage(text).allowed;
}

export { isValidRugbyExercise, clearCache, getCacheStats };

export function isAnyAIConfigured() {
  // OpenRouter via Edge Function siempre está disponible
  if (openrouterProvider.isConfigured()) return true;
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
    saveSetting('gemini_key', key.trim());
    geminiProvider.setApiKey(key.trim());
  } else {
    saveSetting('gemini_key', '');
    geminiProvider.setApiKey('');
  }
}

export function setSelectedModel(modelId, providerId = 'gemini') {
  const models = PROVIDERS[providerId]?.models;
  if (models?.[modelId]) {
    saveSetting(`${providerId}_model`, modelId);
  }
}

export { getRateLimitInfo };
export { getRateLimitInfoForAll as getRateLimitInfoAll };

export async function chatWithAI(question, context = {}) {
  return chat(question, context);
}

export async function streamChatWithAI(prompt, onChunk, options = {}) {
  return streamChat(prompt, onChunk, { mode: options.mode || 'general' });
}

export async function enrichWithAI(plan, player) {
  return enrichPlan(plan, player);
}

export async function generatePlanWithAI(player) {
  return generateTrainingPlan(player);
}

export async function debugAIConnection() {
  const configured = getConfiguredProviders();
  if (configured.length === 0) return { error: true, message: 'Ningún proveedor configurado.' };
  return debugConnection(configured[0]);
}

export function setProviderKey(providerId, key) {
  const map = { openrouter: openrouterProvider, groq: groqProvider, deepseek: deepseekProvider, gemini: geminiProvider };
  map[providerId]?.setApiKey(key);
  saveSetting(`${providerId}_key`, key ? key.trim() : '');
}

export { debugConnection as debugProviderConnection };
export { getActiveProviderId as getActiveProvider };
export { PROVIDERS };
export { DEFAULT_PROVIDER_ORDER };
