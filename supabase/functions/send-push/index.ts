import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface FilterInput {
  team_category?: string | null;
  makgora_team_id?: string | null;
  position?: string | null;
  player_ids?: string[];
}

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  filters?: FilterInput;
}

function base64UrlEncode(str: string): string {
  const base64 = btoa(str);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function getAccessToken(sa: Record<string, string>): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const encoder = new TextEncoder();
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const signatureInput = `${headerB64}.${payloadB64}`;

  const keyData = sa.private_key;
  const pemStr = typeof keyData === 'string' ? keyData : new TextDecoder().decode(keyData);
  const binaryDer = pemToArrayBuffer(pemStr);

  const key = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5' },
    key,
    encoder.encode(signatureInput),
  );

  const sigBytes = new Uint8Array(signature);
  const sigBinary = String.fromCharCode(...sigBytes);
  const signatureB64 = base64UrlEncode(sigBinary);
  const jwt = `${headerB64}.${payloadB64}.${signatureB64}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    throw new Error('Failed to get access token: ' + JSON.stringify(tokenData));
  }
  return tokenData.access_token;
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN [\w\s]+-----/g, '')
    .replace(/-----END [\w\s]+-----/g, '')
    .replace(/\s/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function sendSingleMessage(
  token: string,
  accessToken: string,
  projectId: string,
  title: string,
  body: string,
  data: Record<string, string>,
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        message: {
          token,
          notification: { title, body },
          data: data || {},
          android: {
            priority: 'high',
            notification: {
              channelId: 'orcos_default',
              priority: 'high',
              sound: 'default',
            },
          },
        },
      }),
    },
  );

  if (res.status === 404) {
    const body = await res.json();
    if (body.error?.details?.includes('NotRegistered') || body.error?.details?.includes('UNREGISTERED')) {
      return { ok: false, error: 'NotRegistered' };
    }
    return { ok: false, error: body.error?.message || 'Unknown error' };
  }

  if (!res.ok) {
    const body = await res.json();
    return { ok: false, error: body.error?.message || `HTTP ${res.status}` };
  }

  return { ok: true };
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { title, body, data, filters } = (await req.json()) as PushPayload;

    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: title, body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Read service account
    const saRaw = Deno.env.get('FCM_SERVICE_ACCOUNT');
    if (!saRaw) {
      return new Response(
        JSON.stringify({ error: 'FCM_SERVICE_ACCOUNT not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }
    const serviceAccount = JSON.parse(saRaw);

    // Build query for push_tokens
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const client = createClient(supabaseUrl, supabaseKey);

    let query = client.from('push_tokens').select('token');

    if (filters?.team_category) {
      query = query.eq('team_category', filters.team_category);
    }
    if (filters?.makgora_team_id) {
      query = query.eq('makgora_team_id', filters.makgora_team_id);
    }
    if (filters?.position) {
      query = query.eq('position', filters.position);
    }
    if (filters?.player_ids && filters.player_ids.length > 0) {
      query = query.in('player_id', filters.player_ids);
    }

    const { data: tokens, error: queryError } = await query;

    if (queryError) {
      return new Response(
        JSON.stringify({ error: 'Database query failed', details: queryError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No tokens matched the filters' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Send push to all matching tokens
    const accessToken = await getAccessToken(serviceAccount);
    const results = await Promise.allSettled(
      tokens.map((t: { token: string }) =>
        sendSingleMessage(t.token, accessToken, serviceAccount.project_id, title, body, data || {}),
      ),
    );

    // Clean up invalid tokens
    const tokensToDelete: string[] = [];
    let sent = 0;
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.status === 'fulfilled' && r.value.ok) {
        sent++;
      } else if (r.status === 'fulfilled' && r.value.error === 'NotRegistered') {
        tokensToDelete.push(tokens[i].token);
      }
    }

    if (tokensToDelete.length > 0) {
      await client.from('push_tokens').delete().in('token', tokensToDelete);
    }

    return new Response(
      JSON.stringify({ success: true, sent, invalidCleaned: tokensToDelete.length }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
