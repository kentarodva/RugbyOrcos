import { PROVIDERS, RETRY_CONFIG } from '../aiConfig';
import { callOpenAICompatible, streamOpenAICompatible, sleep } from './openaiCompatible';

const PROVIDER_ID = 'deepseek';

function getConfig() {
  const provider = PROVIDERS[PROVIDER_ID];
  const modelKey = localStorage.getItem(`orcos_${PROVIDER_ID}_model`) || provider.defaultModel;
  const model = provider.models[modelKey] || provider.models[provider.defaultModel];
  const apiKey = localStorage.getItem(provider.apiKeyStorage) || null;
  return { provider, model, modelKey, apiKey, endpoint: provider.endpoint };
}

export function isConfigured() {
  return !!getConfig().apiKey;
}

export function getProviderInfo() {
  const { model } = getConfig();
  return { ...PROVIDERS[PROVIDER_ID], currentModel: model };
}

export function setApiKey(key) {
  const provider = PROVIDERS[PROVIDER_ID];
  if (key) {
    localStorage.setItem(provider.apiKeyStorage, key.trim());
  } else {
    localStorage.removeItem(provider.apiKeyStorage);
  }
}

export function getRateLimitInfo() {
  const { model } = getConfig();
  const key = `orcos_ai_rate_${PROVIDER_ID}_${model.id}_${new Date().toISOString().split('T')[0]}`;
  return {
    used: Number(localStorage.getItem(key) || 0),
    limit: model.dailyLimit
  };
}

function checkRateLimit() {
  const { model } = getConfig();
  const key = `orcos_ai_rate_${PROVIDER_ID}_${model.id}_${new Date().toISOString().split('T')[0]}`;
  const used = Number(localStorage.getItem(key) || 0);
  return used < model.dailyLimit;
}

export function incrementRateLimit() {
  const { model } = getConfig();
  const key = `orcos_ai_rate_${PROVIDER_ID}_${model.id}_${new Date().toISOString().split('T')[0]}`;
  const used = Number(localStorage.getItem(key) || 0);
  localStorage.setItem(key, String(used + 1));
}

export async function call(prompt, options = {}) {
  const { apiKey, model, endpoint } = getConfig();
  if (!apiKey) return { error: true, message: `${PROVIDERS[PROVIDER_ID].name} no configurado.` };
  if (!checkRateLimit()) return { error: true, message: 'Límite diario alcanzado.' };

  const opts = {
    endpoint,
    apiKey,
    modelId: model.id,
    temperature: options.temperature ?? model.temperature.chat,
    maxTokens: options.maxTokens ?? model.maxTokens,
    timeout: options.timeout ?? model.timeout,
    stream: options.stream || false
  };

  const result = await callOpenAICompatible(options.systemPrompt
    ? `${options.systemPrompt}\n\nPregunta: ${prompt}`
    : prompt,
    opts
  );

  if (!result.error || !options.retryOnFailure) return result;

  for (let i = 0; i < RETRY_CONFIG.maxRetries; i++) {
    await sleep(RETRY_CONFIG.backoffMs[i] || 1000);
    const retryResult = await callOpenAICompatible(prompt, opts);
    if (!retryResult.error) return retryResult;
  }

  return result;
}

export async function streamChat(prompt, onChunk, options = {}) {
  const { apiKey, model, endpoint } = getConfig();
  if (!apiKey) {
    onChunk({ error: `${PROVIDERS[PROVIDER_ID].name} no configurado.`, done: true });
    return;
  }
  if (!checkRateLimit()) {
    onChunk({ error: 'Límite diario alcanzado.', done: true });
    return;
  }

  const fullPrompt = options.systemPrompt
    ? `${options.systemPrompt}\n\nPregunta: ${prompt}`
    : prompt;

  await streamOpenAICompatible(fullPrompt, {
    endpoint,
    apiKey,
    modelId: model.id,
    temperature: options.temperature ?? model.temperature.chat,
    maxTokens: options.maxTokens ?? model.maxTokens,
    timeout: options.timeout ?? model.timeout
  }, onChunk);
}

export async function debugConnection() {
  const { apiKey, model, endpoint } = getConfig();
  if (!apiKey) return { error: true, message: 'No configurado.' };
  return callOpenAICompatible('Responde solo "OK".', {
    endpoint,
    apiKey,
    modelId: model.id,
    maxTokens: 5,
    temperature: 0,
    timeout: 10000
  });
}
