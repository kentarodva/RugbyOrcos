const CATEGORY_ICONS_MAP = {
  campo: '🏉',
  gym: '🏋️',
  recuperacion: '🩹',
  prevencion: '🛡️',
};

const SUBCATEGORY_ICONS = {
  tackle: '🤼',
  pase: '🤲',
  scrum: '🏉',
  patada: '🦵',
  evasion: '🏃',
  defensa: '🛡️',
  resistencia: '💨',
  liderazgo: '👑',
  fuerza_inferior: '🦵',
  fuerza_superior: '💪',
  potencia: '⚡',
  core: '🌀',
  velocidad: '🏃‍♂️',
  movilidad: '🩹',
  hombros: '🛡️',
  cuello: '🧣',
  rodillas: '🦵',
  tobillos: '🦶',
};

function ExerciseIcon({ category, subcategory, size = 20 }) {
  const icon = SUBCATEGORY_ICONS[subcategory] || CATEGORY_ICONS_MAP[category] || '🏋️';
  return <span style={{ fontSize: size }}>{icon}</span>;
}

export const CATEGORY_LABELS = {
  campo: 'Campo',
  gym: 'Gimnasio',
  recuperacion: 'Recuperación',
  prevencion: 'Prevención',
};

export const SUBCATEGORY_LABELS = {
  tackle: 'Tackle',
  pase: 'Pase',
  scrum: 'Scrum',
  patada: 'Patada',
  evasion: 'Evasión',
  defensa: 'Defensa',
  resistencia: 'Resistencia',
  liderazgo: 'Liderazgo',
  fuerza_inferior: 'Fuerza Inferior',
  fuerza_superior: 'Fuerza Superior',
  potencia: 'Potencia',
  core: 'Core',
  velocidad: 'Velocidad',
  movilidad: 'Movilidad',
  hombros: 'Hombros',
  cuello: 'Cuello',
  rodillas: 'Rodillas',
  tobillos: 'Tobillos',
};

export const CATEGORY_COLORS = {
  campo: 'var(--color-primary)',
  gym: '#ff3d00',
  recuperacion: '#00b0ff',
  prevencion: '#9c27b0',
};

export default ExerciseIcon;
