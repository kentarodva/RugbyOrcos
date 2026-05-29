async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function callOpenAICompatible(prompt, config) {
  const {
    endpoint,
    apiKey,
    modelId,
    temperature = 0.7,
    maxTokens = 1024,
    timeout = 15000,
    stream = false
  } = config;

  if (!apiKey) return { error: true, message: 'API key no configurada' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const body = {
      model: modelId,
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: maxTokens,
      stream
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    clearTimeout(timer);

    if (!response.ok) {
      let detail = '';
      try {
        const errData = await response.json();
        detail = errData?.error?.message || '';
      } catch { /* noop */ }
      return { error: true, message: `Error (${response.status}).${detail ? ' ' + detail : ' Verifica tu API key.'}` };
    }

    if (stream) {
      return { stream: response.body, error: false };
    }

    const data = await response.json();

    if (data?.error) {
      return { error: true, message: `Error de API: ${data.error.message || 'Respuesta inesperada.'}` };
    }

    const text = data?.choices?.[0]?.message?.content;

    if (!text) {
      const reason = data?.choices?.[0]?.finish_reason || 'desconocido';
      if (reason === 'content_filter') {
        return { error: true, message: 'La respuesta fue bloqueada por filtros de contenido. Reformula tu pregunta.' };
      }
      return { error: true, message: `No se generó respuesta (motivo: ${reason}). Intenta con una pregunta más específica.` };
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

async function streamOpenAICompatible(prompt, config, onChunk) {
  const result = await callOpenAICompatible(prompt, { ...config, stream: true });
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
          const delta = parsed?.choices?.[0]?.delta?.content || parsed?.choices?.[0]?.message?.content;
          if (delta) {
            fullText += delta;
            onChunk({ text: delta, fullText, done: false });
          }
          if (parsed?.choices?.[0]?.finish_reason === 'content_filter') {
            onChunk({ error: 'Respuesta bloqueada por filtros de contenido.', done: true });
            return;
          }
        } catch { /* skip malformed SSE */ }
      }
    }

    if (buffer.trim()) {
      const line = buffer.trim();
      if (line.startsWith('data:') && line !== 'data: [DONE]') {
        const jsonStr = line.replace(/^data:\s*/, '').trim();
        try {
          const parsed = JSON.parse(jsonStr);
          const delta = parsed?.choices?.[0]?.delta?.content || parsed?.choices?.[0]?.message?.content;
          if (delta) {
            fullText += delta;
            onChunk({ text: delta, fullText, done: false });
          }
        } catch { /* skip */ }
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

export { callOpenAICompatible, streamOpenAICompatible, sleep };
