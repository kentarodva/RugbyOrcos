import { supabase } from '../supabaseClient.js';

const cache = new Map();
let loaded = false;

const DEFAULTS = {
  ai_provider: 'auto',
  ai_streaming: 'true',
  groq_model: 'llama3_70b',
  deepseek_model: 'deepseek_chat',
  gemini_model: 'flash',
};

export function getSetting(key) {
  const val = cache.get(key);
  return val !== undefined ? val : DEFAULTS[key] ?? null;
}

export function setSetting(key, value) {
  cache.set(key, value);
}

export async function loadSettings() {
  if (loaded) return;
  const { data } = await supabase.from('club_settings').select('key, value');
  if (data) {
    data.forEach(({ key, value }) => cache.set(key, value));
  }
  loaded = true;
}

export async function saveSetting(key, value) {
  setSetting(key, value);
  try {
    await supabase.from('club_settings').upsert({ key, value: String(value) }, { onConflict: 'key' });
  } catch { /* silencioso */ }
}

export async function saveSettingsBatch(entries) {
  for (const [key, value] of Object.entries(entries)) {
    setSetting(key, value);
  }
  const rows = Object.entries(entries).map(([key, value]) => ({ key, value: String(value) }));
  try {
    await supabase.from('club_settings').upsert(rows, { onConflict: 'key' });
  } catch { /* silencioso */ }
}

export function isLoaded() {
  return loaded;
}
