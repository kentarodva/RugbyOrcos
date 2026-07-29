import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if ((!supabaseUrl || !supabaseAnonKey) && import.meta.env.DEV) {
  console.warn(
    '[Supabase] Variables de entorno no configuradas. Crea un archivo .env con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.'
  );
}

const customFetch = (url, opts) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  return fetch(url, { ...opts, signal: controller.signal })
    .finally(() => clearTimeout(timeout));
};

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: { flowType: 'pkce' },
    global: { fetch: customFetch },
  }
);

if (import.meta.env.DEV) {
  const _from = supabase.from.bind(supabase);
  supabase.from = function (...args) {
    const stack = new Error().stack || '';
    if (!stack.includes('dataService') && !stack.includes('useSync') && !stack.includes('supabaseApi') && !stack.includes('clubSettings') && !stack.includes('pushNotifications') && !stack.includes('AuthContext') && !stack.includes('Login')) {
      console.warn(`[dataService] ⚠️ Acceso directo a Supabase: supabase.from('${args[0]}'). Usá dataService en vez.`, stack.split('\n')[2]?.trim());
    }
    return _from(...args);
  };
}
