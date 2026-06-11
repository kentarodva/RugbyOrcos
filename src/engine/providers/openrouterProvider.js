import { PROVIDERS } from '../aiConfig';
import { supabase } from '../../supabaseClient';

const PROVIDER_ID = 'openrouter';

const EDGE_FN_URL = import.meta.env.VITE_SUPABASE_URL?.replace(/\/+$/, '') + '/functions/v1/ai-proxy';

function getConfig() {
  const provider = PROVIDERS[PROVIDER_ID];
  const modelKey = 'free';
  const model = provider.models[modelKey] || provider.models[provider.defaultModel];
  return { provider, model, modelKey };
}

export function isConfigured() {
  return true;
}

export function getProviderInfo() {
  const { model } = getConfig();
  return { ...PROVIDERS[PROVIDER_ID], currentModel: model };
}

export function setApiKey(_key) {
  // No-op: key is configured server-side in Edge Function secrets
}

function getProviderModels() {
  return PROVIDERS[PROVIDER_ID]?.models || {};
}

export function getRateLimitInfo() {
  return { used: 0, limit: 999999 };
}

export function incrementRateLimit() {
  // No-op: rate limiting handled by OpenRouter server-side
}

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) return {};
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

export async function call(prompt, options = {}) {
  const messages = [];
  if (options.systemPrompt) {
    messages.push({ role: 'system', content: options.systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const model = getProviderModels();
  const modelId = options.modelId || model[getConfig().modelKey]?.id || 'openrouter/free';

  try {
    const headers = await getAuthHeaders();
    if (!headers.Authorization) {
      return { error: true, message: 'No hay sesión activa.' };
    }

    const { data, error } = await supabase.functions.invoke('ai-proxy', {
      body: {
        model: modelId,
        messages,
        stream: false,
        max_tokens: options.maxTokens ?? 4096,
        temperature: options.temperature ?? 0.7,
      },
    });

    if (error) {
      return { error: true, message: `Error de conexión: ${error.message}` };
    }

    if (data?.error) {
      return { error: true, message: data.error };
    }

    const text = data?.choices?.[0]?.message?.content;
    if (!text) {
      return { error: true, message: 'OpenRouter no generó respuesta.' };
    }

    return { text: text.trim(), error: false };
  } catch (e) {
    return { error: true, message: `Error: ${e.message}` };
  }
}

export async function streamChat(prompt, onChunk, options = {}) {
  const messages = [];
  if (options.systemPrompt) {
    messages.push({ role: 'system', content: options.systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const model = getProviderModels();
  const modelId = options.modelId || model[getConfig().modelKey]?.id || 'openrouter/free';

  try {
    const headers = await getAuthHeaders();
    if (!headers.Authorization) {
      onChunk({ error: 'No hay sesión activa.', done: true });
      return;
    }

    const controller = new AbortController();
    const fetchTimeout = setTimeout(() => controller.abort(), 25000);

    let response;
    try {
      response = await fetch(EDGE_FN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': headers.Authorization,
        },
        body: JSON.stringify({
          model: modelId,
          messages,
          stream: true,
          max_tokens: options.maxTokens ?? 4096,
          temperature: options.temperature ?? 0.7,
        }),
        signal: controller.signal,
      });
    } catch (fetchErr) {
      clearTimeout(fetchTimeout);
      const msg = fetchErr.name === 'AbortError'
        ? 'El servicio OpenRouter no respondió a tiempo. Intenta de nuevo.'
        : `Error de conexión: ${fetchErr.message}`;
      onChunk({ error: msg, done: true });
      return;
    }
    clearTimeout(fetchTimeout);

    if (!response.ok) {
      const errText = await response.text();
      onChunk({ error: `Error ${response.status}: ${errText}`, done: true });
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      onChunk({ error: 'No se pudo leer el stream.', done: true });
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';

    try {
      let reading = true;
      while (reading) {
        const { done, value } = await reader.read();
        if (done) { reading = false; break; }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const chunk = parsed.content || '';
              if (chunk) {
                fullText += chunk;
                onChunk({ text: chunk, fullText, done: false });
              }
            } catch { /* skip malformed JSON */ }
          }
        }
      }
    } catch (e) {
      onChunk({ error: `Error de streaming: ${e.message}`, done: true });
      return;
    }

    if (!fullText) {
      onChunk({ error: 'OpenRouter no generó contenido con el modelo gratuito. Intenta de nuevo.', done: true });
      return;
    }

    onChunk({ text: '', fullText, done: true });
  } catch (e) {
    onChunk({ error: `Error: ${e.message}`, done: true });
  }
}

export async function debugConnection() {
  const result = await call('Responde solo "OK".', {
    maxTokens: 5,
    temperature: 0,
  });
  if (result.text?.includes('OK')) return { text: 'OK', error: false };
  return result;
}
