import { PROVIDERS, RETRY_CONFIG } from '../aiConfig';
import { sleep } from './openaiCompatible';

const PROVIDER_ID = 'gemini';

function getConfig() {
  const provider = PROVIDERS[PROVIDER_ID];
  const modelKey = localStorage.getItem('orcos_ai_model') || provider.defaultModel;
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

export function incrementRateLimit() {
  const { model } = getConfig();
  const key = `orcos_ai_rate_${PROVIDER_ID}_${model.id}_${new Date().toISOString().split('T')[0]}`;
  const used = Number(localStorage.getItem(key) || 0);
  localStorage.setItem(key, String(used + 1));
}

function buildUrl(modelId, stream) {
  const { endpoint } = getConfig();
  const { model } = getConfig();
  const id = modelId || model.id;
  return stream
    ? `${endpoint}/${id}:streamGenerateContent`
    : `${endpoint}/${id}:generateContent`;
}

async function callGeminiRaw(prompt, options = {}) {
  const {
    temperature = 0.7,
    maxTokens = 800,
    timeout = 15000,
    modelId = null,
    stream = false
  } = options;

  const { apiKey } = getConfig();
  if (!apiKey) return { error: true, message: 'API key de Gemini no configurada' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const url = stream
    ? `${buildUrl(modelId, true)}?alt=sse&key=${apiKey}`
    : `${buildUrl(modelId, false)}?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature, maxOutputTokens: maxTokens }
      }),
      signal: controller.signal
    });
    clearTimeout(timer);

    if (!response.ok) {
      let detail = '';
      try {
        const errData = await response.json();
        detail = errData?.error?.message || '';
      } catch { /* noop */ }
      return { error: true, message: `Error de Gemini (${response.status}).${detail ? ' ' + detail : ' Verifica tu API key.'}` };
    }

    if (stream) {
      return { stream: response.body, error: false };
    }

    const data = await response.json();

    if (data?.error) {
      return { error: true, message: `Error de API: ${data.error.message || 'Respuesta inesperada.'}` };
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      if (data?.candidates?.[0]?.finishReason === 'SAFETY') {
        return { error: true, message: 'Gemini bloqueó la respuesta por políticas de seguridad. Reformula tu pregunta con otros términos.' };
      }
      const reason = data?.candidates?.[0]?.finishReason || 'desconocido';
      return { error: true, message: `Gemini no generó respuesta (motivo: ${reason}).` };
    }

    return { text, error: false };
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      return { error: true, message: 'La consulta excedió el tiempo límite. Intenta con una pregunta más corta.' };
    }
    return { error: true, message: `Error de conexión: ${err.message}.` };
  }
}

export async function call(prompt, options = {}) {
  const { model } = getConfig();
  const opts = {
    temperature: options.temperature ?? model.temperature.chat,
    maxTokens: options.maxTokens ?? model.maxTokens,
    timeout: options.timeout ?? model.timeout,
    modelId: options.modelId ?? model.id,
    stream: false
  };

  const result = await callGeminiRaw(options.systemPrompt
    ? `${options.systemPrompt}\n\nPregunta: ${prompt}`
    : prompt,
    opts
  );

  if (!result.error || !options.retryOnFailure) return result;

  for (let i = 0; i < RETRY_CONFIG.maxRetries; i++) {
    await sleep(RETRY_CONFIG.backoffMs[i] || 1000);
    const retryResult = await callGeminiRaw(prompt, opts);
    if (!retryResult.error) return retryResult;
  }

  return result;
}

export async function streamChat(prompt, onChunk, options = {}) {
  const { model } = getConfig();
  const result = await callGeminiRaw(options.systemPrompt
    ? `${options.systemPrompt}\n\nPregunta: ${prompt}`
    : prompt,
    {
      temperature: options.temperature ?? model.temperature.chat,
      maxTokens: options.maxTokens ?? model.maxTokens,
      timeout: options.timeout ?? model.timeout,
      modelId: options.modelId ?? model.id,
      stream: true
    }
  );

  if (result.error) {
    onChunk({ error: result.message, done: true });
    return;
  }

  const reader = result.stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  try {
    let streamDone = false;
    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) {
        streamDone = true;
      }

      if (value) {
        buffer += decoder.decode(value, { stream: true });
      }

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || !line.startsWith('data:')) continue;

        const jsonStr = line.replace(/^data:\s*/, '').trim();
        if (jsonStr === '[DONE]') {
          streamDone = true;
          continue;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            fullText += text;
            onChunk({ text, fullText, done: false });
          }
          if (parsed?.candidates?.[0]?.finishReason) {
            const reason = parsed.candidates[0].finishReason;
            if (reason === 'SAFETY') {
              onChunk({ error: 'Gemini bloqueó la respuesta por políticas de seguridad.', done: true });
              return;
            }
          }
        } catch { /* skip malformed SSE */ }
      }
    }

    if (buffer.trim()) {
      const line = buffer.trim();
      if (line.startsWith('data:')) {
        const jsonStr = line.replace(/^data:\s*/, '').trim();
        if (jsonStr !== '[DONE]') {
          try {
            const parsed = JSON.parse(jsonStr);
            const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              fullText += text;
              onChunk({ text, fullText, done: false });
            }
          } catch { /* skip */ }
        }
      }
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      onChunk({ error: `Error de streaming: ${err.message}`, done: true });
      return;
    }
  }

  onChunk({ text: '', fullText, done: true });
}

export async function debugConnection() {
  const { model } = getConfig();
  return callGeminiRaw('Responde solo "OK".', {
    maxTokens: 5,
    temperature: 0,
    timeout: 10000,
    modelId: model.id
  });
}
