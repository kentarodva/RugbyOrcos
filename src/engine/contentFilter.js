import { RUGBY_KEYWORDS_WEIGHTED, PROHIBITED_TOPICS } from './aiConfig';

const NON_RUGBY_PHRASES = [
  'hacer una pizza',
  'cocinar',
  'receta de',
  'clima en',
  'pronóstico',
  'cotización',
  'precio de acción',
  'bitcoin',
  'criptomoneda',
  'elecciones',
  'presidente',
  'película',
  'netflix',
  'canción',
  'música',
  'videojuego',
  'playstation',
  'xbox',
  'código',
  'programar en',
  'javascript',
  'python',
  'react',
  'node'
];

export function isRugbyRelated(text) {
  if (!text) return false;
  const lower = text.toLowerCase();

  const isProhibited = PROHIBITED_TOPICS.some(topic => lower.includes(topic));
  if (isProhibited) return false;

  const isNonRugby = NON_RUGBY_PHRASES.some(phrase => lower.includes(phrase));
  if (isNonRugby) return false;

  let score = 0;
  RUGBY_KEYWORDS_WEIGHTED.forEach(({ word, weight }) => {
    if (lower.includes(word)) score += weight;
  });

  return score >= 1;
}

export function getRugbyScore(text) {
  if (!text) return 0;
  const lower = text.toLowerCase();
  let score = 0;
  RUGBY_KEYWORDS_WEIGHTED.forEach(({ word, weight }) => {
    if (lower.includes(word)) score += weight;
  });
  return score;
}

export function filterMessage(text) {
  if (!text) return { allowed: false, reason: 'La pregunta está vacía.', score: 0 };
  const lower = text.toLowerCase();

  const prohibited = PROHIBITED_TOPICS.find(topic => lower.includes(topic));
  if (prohibited) {
    return { allowed: false, reason: 'Solo puedo hablar de rugby. ¿En qué aspecto del juego necesitas ayuda?', score: 0 };
  }

  const nonRugby = NON_RUGBY_PHRASES.find(phrase => lower.includes(phrase));
  if (nonRugby) {
    return { allowed: false, reason: 'Ese tema no está relacionado con rugby. ¿Necesitas ayuda con táctica, entrenamiento o reglamento?', score: 0 };
  }

  let score = 0;
  RUGBY_KEYWORDS_WEIGHTED.forEach(({ word, weight }) => {
    if (lower.includes(word)) score += weight;
  });

  if (score === 0) {
    return { allowed: false, reason: 'Solo puedo ayudar con rugby. ¿En qué aspecto del juego necesitas ayuda?', score: 0 };
  }

  return { allowed: true, reason: '', score };
}

export function isValidRugbyExercise(exercise) {
  if (!exercise || !exercise.nombre) return false;
  const name = exercise.nombre.toLowerCase();
  let score = 0;
  RUGBY_KEYWORDS_WEIGHTED.forEach(({ word, weight }) => {
    if (name.includes(word)) score += weight;
  });
  if (score < 1) return false;
  if (!['campo', 'gym', 'recuperacion'].includes(exercise.categoria)) return false;
  return true;
}
