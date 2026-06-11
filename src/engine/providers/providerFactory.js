import { PROVIDERS, RETRY_CONFIG } from '../aiConfig';
import { getSetting, setSetting } from '../../data/clubSettings';
import { callOpenAICompatible, streamOpenAICompatible, sleep } from './openaiCompatible';

export function createProvider(providerId) {
  const P = PROVIDERS[providerId];
  if (!P) throw new Error(`Provider "${providerId}" not found in PROVIDERS config.`);

  function getApiKey() {
    return getSetting(`${providerId}_key`) || null;
  }

  function getConfig() {
    const modelKey = getSetting(`${providerId}_model`) || P.defaultModel;
    const model = P.models[modelKey] || P.models[P.defaultModel];
    const apiKey = getApiKey();
    return { model, apiKey, endpoint: P.endpoint };
  }

  function isConfigured() { return !!getConfig().apiKey; }

  function getProviderInfo() {
    const { model } = getConfig();
    return { ...P, currentModel: model };
  }

  function setApiKey(key) {
    setSetting(`${providerId}_key`, key ? key.trim() : '');
  }

  function getRateLimitInfo() {
    const { model } = getConfig();
    const key = `orcos_ai_rate_${providerId}_${model.id}_${new Date().toISOString().split('T')[0]}`;
    return { used: Number(getSetting(key) || 0), limit: model.dailyLimit };
  }

  function checkRateLimit() {
    const { model } = getConfig();
    const key = `orcos_ai_rate_${providerId}_${model.id}_${new Date().toISOString().split('T')[0]}`;
    return Number(getSetting(key) || 0) < model.dailyLimit;
  }

  function incrementRateLimit() {
    const { model } = getConfig();
    const key = `orcos_ai_rate_${providerId}_${model.id}_${new Date().toISOString().split('T')[0]}`;
    const used = Number(getSetting(key) || 0);
    setSetting(key, String(used + 1));
  }

  async function call(prompt, options = {}) {
    const { apiKey, model, endpoint } = getConfig();
    if (!apiKey) return { error: true, message: `${P.name} no configurado.` };
    if (!checkRateLimit()) return { error: true, message: 'Limite diario alcanzado.' };

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
    if (!checkRateLimit()) { onChunk({ error: 'Limite diario alcanzado.', done: true }); return; }

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
