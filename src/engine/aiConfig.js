const PROVIDERS = {
  groq: {
    id: 'groq',
    name: 'Groq',
    icon: '⚡',
    desc: 'Gratis, rápido, 14,400 req/día',
    priority: 1,
    apiKeyStorage: 'orcos_groq_key',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    models: {
      llama3_70b: {
        id: 'llama3-70b-8192',
        label: 'Llama 3 70B',
        icon: '🦙',
        desc: 'Equilibrio velocidad/calidad',
        maxTokens: 2048,
        timeout: 10000,
        dailyLimit: 14400,
        temperature: { chat: 0.5, training: 0.7, analysis: 0.3 }
      },
      mixtral_8x7b: {
        id: 'mixtral-8x7b-32768',
        label: 'Mixtral 8x7B',
        icon: '🌪️',
        desc: 'Respuestas más largas, contexto 32K',
        maxTokens: 2048,
        timeout: 15000,
        dailyLimit: 14400,
        temperature: { chat: 0.5, training: 0.7, analysis: 0.3 }
      }
    },
    defaultModel: 'llama3_70b'
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    icon: '🔍',
    desc: 'Gratis, 500 req/día',
    priority: 2,
    apiKeyStorage: 'orcos_deepseek_key',
    endpoint: 'https://api.deepseek.com/chat/completions',
    models: {
      deepseek_chat: {
        id: 'deepseek-chat',
        label: 'DeepSeek V3',
        icon: '🐋',
        desc: 'Bueno para razonamiento técnico',
        maxTokens: 2048,
        timeout: 20000,
        dailyLimit: 500,
        temperature: { chat: 0.5, training: 0.7, analysis: 0.3 }
      }
    },
    defaultModel: 'deepseek_chat'
  },
  gemini: {
    id: 'gemini',
    name: 'Gemini',
    icon: '🧠',
    desc: '1,500 req/día gratis',
    priority: 3,
    apiKeyStorage: 'orcos_gemini_key',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    models: {
      flash: {
        id: 'gemini-2.5-flash',
        label: 'Gemini 2.5 Flash',
        icon: '💎',
        desc: 'Rápido, ideal para chat y planes de entrenamiento',
        maxTokens: 1500,
        timeout: 15000,
        dailyLimit: 1500,
        temperature: { chat: 0.5, training: 0.7, analysis: 0.3 }
      }
    },
    defaultModel: 'flash'
  }
};

const RETRY_CONFIG = {
  maxRetries: 2,
  backoffMs: [1000, 3000]
};

const CACHE_CONFIG = {
  maxEntries: 50,
  ttlMinutes: 60,
  storageKey: 'orcos_ai_cache'
};

const RATE_LIMIT_STORAGE_PREFIX = 'orcos_ai_rate';

const CHAT_MODES = {
  general: {
    id: 'general',
    label: 'General',
    icon: '🏉',
    placeholder: 'Pregúntame sobre rugby...'
  },
  tactico: {
    id: 'tactico',
    label: 'Táctico',
    icon: '📋',
    placeholder: 'Consulta de táctica, formaciones o estrategia...'
  },
  reglas: {
    id: 'reglas',
    label: 'Reglas',
    icon: '📖',
    placeholder: 'Pregunta sobre el reglamento de World Rugby...'
  }
};

const PROHIBITED_TOPICS = [
  'política', 'politica', 'religión', 'religion',
  'apuestas', 'gambling', 'drogas', 'drugs',
  'armas', 'weapons', 'hack', 'crack',
  'violencia doméstica', 'explicito', 'explicit'
];

const RUGBY_KEYWORDS_WEIGHTED = [
  { word: 'rugby', weight: 3 },
  { word: 'tackle', weight: 2 }, { word: 'tacklear', weight: 2 }, { word: 'tacle', weight: 2 },
  { word: 'scrum', weight: 2 }, { word: 'melé', weight: 2 }, { word: 'mele', weight: 2 },
  { word: 'ruck', weight: 2 }, { word: 'maul', weight: 2 },
  { word: 'lineout', weight: 2 }, { word: 'line', weight: 1 }, { word: 'saque de banda', weight: 2 },
  { word: 'pase', weight: 1 }, { word: 'passing', weight: 1 }, { word: 'handling', weight: 1 },
  { word: 'patada', weight: 1 }, { word: 'kick', weight: 1 }, { word: 'patear', weight: 1 },
  { word: 'try', weight: 2 }, { word: 'ensayo', weight: 2 }, { word: 'in-goal', weight: 1 },
  { word: 'conversion', weight: 1 }, { word: 'drop goal', weight: 1 }, { word: 'penal', weight: 1 },
  { word: 'wing', weight: 1 }, { word: 'ala', weight: 1 }, { word: 'fullback', weight: 1 },
  { word: 'zaguero', weight: 1 }, { word: 'centro', weight: 1 }, { word: 'centre', weight: 1 },
  { word: 'apertura', weight: 1 }, { word: 'fly half', weight: 1 },
  { word: 'pilar', weight: 1 }, { word: 'hooker', weight: 1 }, { word: 'talonador', weight: 1 },
  { word: 'segunda línea', weight: 1 }, { word: 'lock', weight: 1 },
  { word: 'flanker', weight: 1 }, { word: 'octavo', weight: 1 }, { word: 'number eight', weight: 1 },
  { word: 'delantero', weight: 1 }, { word: 'forward', weight: 1 }, { word: 'back', weight: 1 },
  { word: 'sentadilla', weight: 1 }, { word: 'squat', weight: 1 },
  { word: 'peso muerto', weight: 1 }, { word: 'deadlift', weight: 1 },
  { word: 'press banca', weight: 1 }, { word: 'bench press', weight: 1 },
  { word: 'dominada', weight: 1 }, { word: 'pull up', weight: 1 },
  { word: 'remo', weight: 1 }, { word: 'row', weight: 1 },
  { word: 'power clean', weight: 1 }, { word: 'arranque', weight: 1 }, { word: 'snatch', weight: 1 },
  { word: 'salto', weight: 1 }, { word: 'jump', weight: 1 }, { word: 'box jump', weight: 1 },
  { word: 'sprint', weight: 1 }, { word: 'velocidad', weight: 1 },
  { word: 'agilidad', weight: 1 }, { word: 'core', weight: 1 },
  { word: 'plancha', weight: 1 }, { word: 'rueda abdominal', weight: 1 },
  { word: 'cuello', weight: 1 }, { word: 'hombro', weight: 1 },
  { word: 'rodilla', weight: 1 }, { word: 'tobillo', weight: 1 }, { word: 'prevención', weight: 1 },
  { word: 'estiramiento', weight: 1 }, { word: 'foam roller', weight: 1 },
  { word: 'recuperación', weight: 1 }, { word: 'recovery', weight: 1 },
  { word: 'intervalo', weight: 1 }, { word: 'interval', weight: 1 },
  { word: 'bronco', weight: 1 }, { word: 'resistencia', weight: 1 }, { word: 'cardio', weight: 1 },
  { word: 'defensa', weight: 1 }, { word: 'ataque', weight: 1 },
  { word: 'evasión', weight: 1 }, { word: 'side step', weight: 1 }, { word: 'finta', weight: 1 },
  { word: 'formación', weight: 1 }, { word: 'alineación', weight: 1 },
  { word: 'estrategia', weight: 1 }, { word: 'táctica', weight: 1 }, { word: 'tactica', weight: 1 },
  { word: 'offside', weight: 1 }, { word: 'fuera de juego', weight: 1 },
  { word: 'infracción', weight: 1 }, { word: 'tarjeta', weight: 1 },
  { word: 'capitán', weight: 1 }, { word: 'capitania', weight: 1 }, { word: 'liderazgo', weight: 1 },
  { word: 'gym', weight: 1 }, { word: 'gimnasio', weight: 1 },
  { word: 'fuerza', weight: 1 }, { word: 'potencia', weight: 1 }, { word: 'hipertrofia', weight: 1 },
  { word: 'world rugby', weight: 3 }, { word: 'reglamento', weight: 1 }, { word: 'ley', weight: 1 },
  { word: 'entrenar', weight: 1 }, { word: 'entrenamiento', weight: 1 }, { word: 'entreno', weight: 1 },
  { word: 'rutina', weight: 1 }, { word: 'ejercicio', weight: 1 },
  { word: 'jugador', weight: 1 }, { word: 'equipo', weight: 1 }, { word: 'club', weight: 1 },
  { word: 'partido', weight: 1 }, { word: 'cancha', weight: 1 }, { word: 'campo', weight: 1 },
  { word: 'torneo', weight: 1 }, { word: 'campeonato', weight: 1 },
  { word: 'liga', weight: 1 }, { word: 'temporada', weight: 1 },
  { word: 'lesión', weight: 1 }, { word: 'lesion', weight: 1 },
  { word: 'rehabilitación', weight: 1 }, { word: 'prevenir', weight: 1 },
  { word: 'orcos', weight: 2 }, { word: 'orco', weight: 2 }
];

const DEFAULT_PROVIDER_ORDER = ['groq', 'deepseek', 'gemini'];

export {
  PROVIDERS,
  RETRY_CONFIG,
  CACHE_CONFIG,
  RATE_LIMIT_STORAGE_PREFIX,
  CHAT_MODES,
  PROHIBITED_TOPICS,
  RUGBY_KEYWORDS_WEIGHTED,
  DEFAULT_PROVIDER_ORDER
};
