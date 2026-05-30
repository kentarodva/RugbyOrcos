// ── Factory compartido para providers OpenAI-compatibles (Groq, DeepSeek) ──
// La lógica es idéntica entre groqProvider y deepseekProvider; solo cambia PROVIDER_ID.
// Este módulo exporta un factory que recibe el id y devuelve el provider completo.
import { PROVIDERS, RETRY_CONFIG } from '../aiConfig';
import { callOpenAICompatible, streamOpenAICompatible, sleep } from './openaiCompatible';

export function createProvider(providerId) {
  const P = PROVIDERS[providerId];
  if (!P) throw new Error(`Provider "${providerId}" not found in PROVIDERS config.`);

  function getConfig() {
    const modelKey = localStorage.getItem(`orcos_${providerId}_model`) || P.defaultModel;
    const model = P.models[modelKey] || P.models[P.defaultModel];
    const apiKey = localStorage.getItem(P.apiKeyStorage) || null;
    return { model, apiKey, endpoint: P.endpoint };
  }

  function isConfigured() { return !!getConfig().apiKey; }

  function getProviderInfo() {
    const { model } = getConfig();
    return { ...P, currentModel: model };
  }

  function setApiKey(key) {
    if (key) localStorage.setItem(P.apiKeyStorage, key.trim());
    else localStorage.removeItem(P.apiKeyStorage);
  }

  function getRateLimitInfo() {
    const { model } = getConfig();
    const key = `orcos_ai_rate_${providerId}_${model.id}_${new Date().toISOString().split('T')[0]}`;
    return { used: Number(localStorage.getItem(key) || 0), limit: model.dailyLimit };
  }

  function checkRateLimit() {
    const { model } = getConfig();
    const key = `orcos_ai_rate_${providerId}_${model.id}_${new Date().toISOString().split('T')[0]}`;
    return Number(localStorage.getItem(key) || 0) < model.dailyLimit;
  }

  function incrementRateLimit() {
    const { model } = getConfig();
    const key = `orcos_ai_rate_${providerId}_${model.id}_${new Date().toISOString().split('T')[0]}`;
    const used = Number(localStorage.getItem(key) || 0);
    localStorage.setItem(key, String(used + 1));
    try {
      const bc = new BroadcastChannel('orcos_ai_rate');
      bc.postMessage({ providerId, used: used + 1, modelId: model.id });
      bc.close();
    } catch { /* BroadcastChannel no soportado */ }
  }

  async function call(prompt, options = {}) {
    const { apiKey, model, endpoint } = getConfig();
    if (!apiKey) return { error: true, message: `${P.name} no configurado.` };
    if (!checkRateLimit()) return { error: true, message: 'Límite diario alcanzado.' };

    const opts = {
      endpoint, apiKey, modelId: model.id,
      temperature: options.temperature ?? model.temperature.chat,
      maxTokens: options.maxTokens ?? model.maxTokens,
      timeout: options.timeout ?? model.timeout,
      stream: options.stream || false
    };

    const fullPrompt = options.systemPrompt ? `${options.systemPrompt}\n\nPregunta: ${prompt}` : prompt;
    const result = await callOpenAICompatible(fullPrompt, opts);

    if (!result.error) {
      incrementRateLimit();
      return result;
    }

    if (!options.retryOnFailure) return result;

    for (let i = 0; i < RETRY_CONFIG.maxRetries; i++) {
      await sleep(RETRY_CONFIG.backoffMs[i] || 1000);
      const retryResult = await callOpenAICompatible(fullPrompt, opts);
      if (!retryResult.error) { incrementRateLimit(); return retryResult; }
    }
    return result;
  }

  async function streamChat(prompt, onChunk, options = {}) {
    const { apiKey, model, endpoint } = getConfig();
    if (!apiKey) { onChunk({ error: `${P.name} no configurado.`, done: true }); return; }
    if (!checkRateLimit()) { onChunk({ error: 'Límite diario alcanzado.', done: true }); return; }

    let streamError = false;
    const wrappedOnChunk = (chunk) => {
      if (chunk.error) streamError = true;
      if (chunk.done && !streamError) incrementRateLimit();
      onChunk(chunk);
    };

    await streamOpenAICompatible(
      options.systemPrompt ? `${options.systemPrompt}\n\nPregunta: ${prompt}` : prompt,
      { endpoint, apiKey, modelId: model.id,
        temperature: options.temperature ?? model.temperature.chat,
        maxTokens: options.maxTokens ?? model.maxTokens,
        timeout: options.timeout ?? model.timeout },
      wrappedOnChunk
    );
  }

  async function debugConnection() {
    const { apiKey, model, endpoint } = getConfig();
    if (!apiKey) return { error: true, message: 'No configurado.' };
    return callOpenAICompatible('Responde solo "OK".', {
      endpoint, apiKey, modelId: model.id, maxTokens: 5, temperature: 0, timeout: 10000
    });
  }

  return { isConfigured, getProviderInfo, setApiKey, getRateLimitInfo, incrementRateLimit, call, streamChat, debugConnection };
}

try {
  const bc = new BroadcastChannel('orcos_ai_rate');
  bc.onmessage = (event) => {
    const { providerId: pid, used, modelId: mid } = event.data || {};
    if (!pid || !mid) return;
    const key = `orcos_ai_rate_${pid}_${mid}_${new Date().toISOString().split('T')[0]}`;
    const current = Number(localStorage.getItem(key) || 0);
    if (used > current) localStorage.setItem(key, String(used));
  };
} catch { /* BroadcastChannel no soportado */ }
