import { PROVIDERS, DEFAULT_PROVIDER_ORDER } from './aiConfig';
import { filterMessage, isValidRugbyExercise } from './contentFilter';
import { buildSystemPrompt, buildTrainingEnrichmentPrompt } from './promptBuilder';
import { getCachedResponse, setCachedResponse } from './aiCache';
import * as groqProvider from './providers/groqProvider';
import * as deepseekProvider from './providers/deepseekProvider';
import * as geminiProvider from './providers/geminiProvider';

function getProviderModule(providerId) {
  switch (providerId) {
    case 'groq': return groqProvider;
    case 'deepseek': return deepseekProvider;
    case 'gemini': return geminiProvider;
    default: return null;
  }
}

function getActiveProviderId() {
  const saved = localStorage.getItem('orcos_ai_provider');
  if (saved === 'auto' || !saved) return 'auto';
  if (PROVIDERS[saved]) return saved;
  return 'auto';
}

function getProviderOrder() {
  const saved = localStorage.getItem('orcos_ai_provider');
  if (!saved || saved === 'auto') return DEFAULT_PROVIDER_ORDER;
  return [saved, ...DEFAULT_PROVIDER_ORDER.filter(p => p !== saved)];
}

function isAnyProviderConfigured() {
  return DEFAULT_PROVIDER_ORDER.some(id => {
    const p = PROVIDERS[id];
    return p && !!localStorage.getItem(p.apiKeyStorage);
  });
}

function getConfiguredProviders() {
  return DEFAULT_PROVIDER_ORDER.filter(id => {
    const p = PROVIDERS[id];
    return p && !!localStorage.getItem(p.apiKeyStorage);
  });
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
  const systemPrompt = buildSystemPrompt(mode);

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
  const systemPrompt = buildSystemPrompt(mode);

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

    try {
      await mod.streamChat(question, (chunk) => {
        if (!chunk.error) {
          onChunk({ ...chunk, provider: providerId });
        } else {
          onChunk(chunk);
        }
        if (chunk.done && !chunk.error) {
          success = true;
          mod.incrementRateLimit();
        }
      }, { systemPrompt });

      if (success) return;
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

export async function debugConnection(providerId) {
  const mod = getProviderModule(providerId);
  if (!mod || !mod.debugConnection) return { error: true, message: 'Proveedor no válido.' };
  return mod.debugConnection();
}

export { isAnyProviderConfigured, getConfiguredProviders, getRateLimitInfoForAll, getRateLimitInfo, getActiveProviderId, PROVIDERS, DEFAULT_PROVIDER_ORDER };
