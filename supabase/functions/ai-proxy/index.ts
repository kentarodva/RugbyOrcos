import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface RequestBody {
  model?: string;
  messages: ChatMessage[];
  stream?: boolean;
  max_tokens?: number;
  temperature?: number;
}

const OPENROUTER_API = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "openrouter/free";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const UPSTREAM_TIMEOUT_MS = 15000;

function errorJson(msg: string, status: number): Response {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function addCors(headers: Record<string, string>): Record<string, string> {
  return { ...CORS_HEADERS, ...headers };
}

function fetchWithTimeout(url: string, options: RequestInit, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeout));
}

async function handleNonStream(body: RequestBody, apiKey: string): Promise<Response> {
  try {
    const res = await fetchWithTimeout(OPENROUTER_API, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": Deno.env.get("SUPABASE_URL") || "https://orcosnegros.com",
        "X-Title": "Orcos Negros - Reino Manager",
      },
      body: JSON.stringify({
        model: body.model || DEFAULT_MODEL,
        messages: body.messages,
        max_tokens: body.max_tokens ?? 4096,
        temperature: body.temperature ?? 0.7,
      }),
    }, UPSTREAM_TIMEOUT_MS);

    if (!res.ok) {
      const err = await res.text();
      return new Response(JSON.stringify({ error: `OpenRouter error ${res.status}: ${err}` }), {
        status: res.status,
        headers: addCors({ "Content-Type": "application/json" }),
      });
    }

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: addCors({ "Content-Type": "application/json" }),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: `OpenRouter timeout or error: ${msg}` }), {
      status: 504,
      headers: addCors({ "Content-Type": "application/json" }),
    });
  }
}

async function handleStream(body: RequestBody, apiKey: string): Promise<Response> {
  let openRouterRes: Response;
  try {
    openRouterRes = await fetchWithTimeout(OPENROUTER_API, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Accept": "text/event-stream",
        "HTTP-Referer": Deno.env.get("SUPABASE_URL") || "https://orcosnegros.com",
        "X-Title": "Orcos Negros - Reino Manager",
      },
      body: JSON.stringify({
        model: body.model || DEFAULT_MODEL,
        messages: body.messages,
        stream: true,
        max_tokens: body.max_tokens ?? 4096,
        temperature: body.temperature ?? 0.7,
      }),
    }, UPSTREAM_TIMEOUT_MS);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: `OpenRouter timeout: ${msg}` }), {
      status: 504,
      headers: addCors({ "Content-Type": "application/json" }),
    });
  }

  if (!openRouterRes.ok) {
    const err = await openRouterRes.text();
    return new Response(JSON.stringify({ error: `OpenRouter error ${openRouterRes.status}: ${err}` }), {
      status: openRouterRes.status,
      headers: addCors({ "Content-Type": "application/json" }),
    });
  }

  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  const reader = openRouterRes.body?.getReader();
  if (!reader) {
    return new Response(JSON.stringify({ error: "No response body" }), {
      status: 500,
      headers: addCors({ "Content-Type": "application/json" }),
    });
  }

  (async () => {
    const decoder = new TextDecoder();
    let buffer = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.text || "";
              if (content) {
                await writer.write(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
              }
            } catch {
              // skip malformed JSON
            }
          }
        }
      }
    } catch (e) {
      console.error("Stream error:", e);
    } finally {
      await writer.write(encoder.encode("data: [DONE]\n\n"));
      await writer.close();
    }
  })();

  return new Response(readable, {
    headers: addCors({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    }),
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return errorJson("Method not allowed", 405);
  }

  // Verificar JWT del usuario autenticado
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return errorJson("Missing or malformed Authorization header", 401);
  }
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return errorJson("Unauthorized: invalid or expired token", 401);
  }

  try {
    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) {
      return errorJson("OPENROUTER_API_KEY not configured in Edge Function secrets", 500);
    }

    const body: RequestBody = await req.json();

    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return errorJson("Missing required field: messages", 400);
    }

    if (body.stream) {
      return await handleStream(body, apiKey);
    }
    return await handleNonStream(body, apiKey);
  } catch (err) {
    return errorJson(err instanceof Error ? err.message : "Unknown error", 500);
  }
});
