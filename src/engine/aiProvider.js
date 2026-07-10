import { PROVIDERS, DEFAULT_PROVIDER_ORDER } from './aiConfig';
import { filterMessage, isValidRugbyExercise } from './contentFilter';
import { buildSystemPrompt, buildTrainingEnrichmentPrompt, buildAITrainingPlanPrompt } from './promptBuilder';
import { getCachedResponse, setCachedResponse } from './aiCache';
import { getSetting } from '../data/clubSettings';
import * as openrouterProvider from './providers/openrouterProvider';
import * as groqProvider from './providers/groqProvider';
import * as deepseekProvider from './providers/deepseekProvider';
import * as geminiProvider from './providers/geminiProvider';

function getProviderModule(providerId) {
  switch (providerId) {
    case 'openrouter': return openrouterProvider;
    case 'groq': return groqProvider;
    case 'deepseek': return deepseekProvider;
    case 'gemini': return geminiProvider;
    default: return null;
  }
}

function getActiveProviderId() {
  const saved = getSetting('ai_provider');
  if (saved === 'auto' || !saved) return 'auto';
  if (PROVIDERS[saved]) return saved;
  return 'auto';
}

function getProviderOrder() {
  const saved = getSetting('ai_provider');
  if (!saved || saved === 'auto') return DEFAULT_PROVIDER_ORDER;
  return [saved, ...DEFAULT_PROVIDER_ORDER.filter(p => p !== saved)];
}

function isAnyProviderConfigured() {
  // OpenRouter via Edge Function siempre está disponible
  if (openrouterProvider.isConfigured()) return true;
  return DEFAULT_PROVIDER_ORDER.some(id => {
    return !!getSetting(`${id}_key`);
  });
}

function getConfiguredProviders() {
  const configured = [];
  DEFAULT_PROVIDER_ORDER.forEach(id => {
    if (id === 'openrouter' ? !!getSetting('openrouter_key') : !!getSetting(`${id}_key`)) {
      configured.push(id);
    }
  });
  return configured;
}

function getRateLimitInfo(providerId) {
  const mod = getProviderModule(providerId);
  if (mod && mod.getRateLimitInfo) return mod.getRateLimitInfo();
  return { used: 0, limit: 999 };
}

function getRateLimitInfoForAll() {
  const result = {};
  DEFAULT_PROVIDER_ORDER.forEach(id => {
    if (PROVIDERS[id]) result[id] = getRateLimitInfo(id);
  });
  return result;
}

export async function chat(question, context = {}) {
  if (!isAnyProviderConfigured()) {
    return { error: 'Ningún proveedor IA configurado. Ve a Configuración (⚙️).' };
  }

  const filterResult = filterMessage(question);
  if (!filterResult.allowed) return { error: filterResult.reason };

  const mode = context.mode || 'general';
  const systemPrompt = buildSystemPrompt(mode, context);

  const cached = getCachedResponse(question, 'auto', mode);
  if (cached) return { text: cached, provider: 'cache' };

  const providerOrder = getProviderOrder();
  let lastError = '';

  for (const providerId of providerOrder) {
    const mod = getProviderModule(providerId);
    if (!mod || !mod.isConfigured()) continue;

    const { used, limit } = getRateLimitInfo(providerId);
    if (used >= limit) {
      lastError = `${PROVIDERS[providerId].name}: límite diario.`;
      continue;
    }

    try {
      const result = await mod.call(question, {
        systemPrompt,
        retryOnFailure: true
      });

      if (result.error) {
        lastError = `${PROVIDERS[providerId].name}: ${result.message}`;
        continue;
      }

      if (result.text) {
        mod.incrementRateLimit();
        setCachedResponse(question, 'auto', mode, result.text);
        return { text: result.text, provider: providerId };
      }
    } catch (e) {
      lastError = `${PROVIDERS[providerId].name}: ${e.message}`;
    }
  }

  return { error: `Todos los proveedores fallaron. ${lastError || 'Intenta de nuevo.'}` };
}

export async function streamChat(question, onChunk, context = {}) {
  if (!isAnyProviderConfigured()) {
    onChunk({ error: 'Ningún proveedor IA configurado.', done: true });
    return;
  }

  const filterResult = filterMessage(question);
  if (!filterResult.allowed) {
    onChunk({ error: filterResult.reason, done: true });
    return;
  }

  const mode = context.mode || 'general';
  const systemPrompt = buildSystemPrompt(mode, context);

  const providerOrder = getProviderOrder();
  let lastError = '';
  let triedOne = false;

  for (const providerId of providerOrder) {
    const mod = getProviderModule(providerId);
    if (!mod || !mod.isConfigured()) continue;

    const { used, limit } = getRateLimitInfo(providerId);
    if (used >= limit) {
      lastError = `${PROVIDERS[providerId].name}: límite diario.`;
      continue;
    }

    triedOne = true;
    let success = false;
    let providerError = '';

    try {
      await mod.streamChat(question, (chunk) => {
        if (!chunk.error) {
          onChunk({ ...chunk, provider: providerId });
        } else {
          providerError = chunk.error;
          onChunk(chunk);
        }
        if (chunk.done && !chunk.error) {
          success = true;
          mod.incrementRateLimit();
        }
      }, { systemPrompt });

      if (success) return;
      if (providerError) lastError = `${PROVIDERS[providerId].name}: ${providerError}`;
    } catch (e) {
      lastError = `${PROVIDERS[providerId].name}: ${e.message}`;
    }
  }

  if (!triedOne) {
    onChunk({ error: 'Ningún proveedor configurado o con cuota disponible.', done: true });
  } else {
    onChunk({ error: `Todos los proveedores fallaron. ${lastError}`, done: true });
  }
}

export async function enrichPlan(plan, player) {
  if (!isAnyProviderConfigured()) return plan;

  const prompt = buildTrainingEnrichmentPrompt(plan, player);
  const providerOrder = getProviderOrder();

  for (const providerId of providerOrder) {
    const mod = getProviderModule(providerId);
    if (!mod || !mod.isConfigured()) continue;

    const { used, limit } = getRateLimitInfo(providerId);
    if (used >= limit) continue;

    try {
      const result = await mod.call(prompt, { temperature: 0.7, maxTokens: 800, retryOnFailure: false });
      if (result.error || !result.text) continue;
      mod.incrementRateLimit();

      const trimmed = result.text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(trimmed);

      if (parsed.sugerencias && Array.isArray(parsed.sugerencias)) {
        const valid = parsed.sugerencias.filter(isValidRugbyExercise);
        if (valid.length === 0) continue;

        const enriched = valid.map((s, i) => ({
          id: `ai_${Date.now()}_${i}`,
          name: s.nombre,
          category: s.categoria || 'campo',
          subcategory: 'ia',
          targetPositions: ['TODOS'],
          difficulty: 3,
          durationMin: 15,
          equipment: [],
          drills: s.drills || [],
          aiReason: s.razon || '',
          fromAI: true
        }));

        return {
          ...plan,
          plan: {
            campo: [...plan.plan.campo, ...enriched.filter(e => e.category === 'campo')],
            gym: [...plan.plan.gym, ...enriched.filter(e => e.category === 'gym')],
            recuperacion: [...plan.plan.recuperacion, ...enriched.filter(e => e.category === 'recuperacion')]
          },
          enrichedByAI: true
        };
      }
    } catch { continue; }
  }

  return plan;
}

export async function generateTrainingPlan(player) {
  if (!isAnyProviderConfigured()) return null;
  const prompt = buildAITrainingPlanPrompt(player);
  const providerOrder = getProviderOrder();
  for (const providerId of providerOrder) {
    const mod = getProviderModule(providerId);
    if (!mod || !mod.isConfigured()) continue;
    const { used, limit } = getRateLimitInfo(providerId);
    if (used >= limit) continue;
    try {
      const result = await mod.call(prompt, { temperature: 0.7, maxTokens: 1500, retryOnFailure: false });
      if (result.error || !result.text) continue;
      mod.incrementRateLimit();

      let parsed = null;
      try {
        parsed = JSON.parse(result.text);
      } catch {
        let text = result.text.replace(/```(?:json)?\s*/gi, '').replace(/```\s*/g, '').trim();
        try {
          parsed = JSON.parse(text);
        } catch {
          const match = text.match(/\{[\s\S]*\}/);
          if (match) {
            try { parsed = JSON.parse(match[0]); } catch { continue; }
          }
        }
      }
      if (!parsed?.plan) continue;

      const providerConfig = PROVIDERS[providerId];
      const defaultModelId = providerConfig?.defaultModel;
      const modelId = providerConfig?.models?.[defaultModelId]?.id || providerId;
      return { ...parsed, provider: providerId, model: modelId, fromAI: true };
    } catch { continue; }
  }
  return null;
}

export async function debugConnection(providerId) {
  const mod = getProviderModule(providerId);
  if (!mod || !mod.debugConnection) return { error: true, message: 'Proveedor no válido.' };
  return mod.debugConnection();
}

export { isAnyProviderConfigured, getConfiguredProviders, getRateLimitInfoForAll, getRateLimitInfo, getActiveProviderId, PROVIDERS, DEFAULT_PROVIDER_ORDER };
