const CATEGORY_ICONS_MAP = {
  calentamiento: '🔥',
  campo: '🏉',
  crossfit: '💀',
  casa: '🏠',
  gym: '🏋️',
  recuperacion: '🩹',
  prevencion: '🛡️',
};

const SUBCATEGORY_ICONS = {
  general: '🏋️',
  tackle: '🤼',
  pase: '🤲',
  scrum: '🏉',
  patada: '🦵',
  evasion: '🏃',
  defensa: '🛡️',
  resistencia: '💨',
  liderazgo: '👑',
  pecho: '🦾',
  espalda: '🔙',
  pierna: '🦵',
  hombro: '💪',
  brazo: '💪',
  fuerza_inferior: '🦵',
  fuerza_superior: '💪',
  potencia: '⚡',
  core: '🌀',
  velocidad: '🏃‍♂️',
  cardio: '❤️',
  levantamiento: '🏋️',
  movilidad: '🩹',
  rodillas: '🦵',
  tobillos: '🦶',
  cuello: '🧣',
  hombros: '🛡️',
};

function ExerciseIcon({ category, subcategory, size = 20 }) {
  const icon = SUBCATEGORY_ICONS[subcategory] || CATEGORY_ICONS_MAP[category] || '🏋️';
  return <span style={{ fontSize: size }}>{icon}</span>;
}

export const CATEGORY_LABELS = {
  calentamiento: 'Calentamiento',
  campo: 'Campo',
  crossfit: 'CrossFit',
  casa: 'Casa',
  gym: 'Gimnasio',
  recuperacion: 'Recuperación',
  prevencion: 'Prevención',
};

export const SUBCATEGORY_LABELS = {
  general: 'General',
  tackle: 'Tackle',
  pase: 'Pase',
  scrum: 'Scrum',
  patada: 'Patada',
  evasion: 'Evasión',
  defensa: 'Defensa',
  resistencia: 'Resistencia',
  liderazgo: 'Liderazgo',
  pecho: 'Pecho',
  espalda: 'Espalda',
  pierna: 'Pierna',
  hombro: 'Hombro',
  brazo: 'Brazo',
  fuerza_inferior: 'Fuerza Inferior',
  fuerza_superior: 'Fuerza Superior',
  potencia: 'Potencia',
  core: 'Core',
  velocidad: 'Velocidad',
  cardio: 'Cardio',
  levantamiento: 'Levantamiento',
  movilidad: 'Movilidad',
  rodillas: 'Rodillas',
  tobillos: 'Tobillos',
  cuello: 'Cuello',
  hombros: 'Hombros',
};

export const CATEGORY_COLORS = {
  campo: 'var(--color-primary)',
  gym: '#FF5C4D',
  recuperacion: '#5AA9FF',
  prevencion: '#9c27b0',
};

export default ExerciseIcon;
