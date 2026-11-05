// Quick-filter groups (Hevy/Fitbod style) over the dataset's English `target_muscle` / `equipment` values.
// Values taken from seed/exercises-dataset.json.

export const MUSCLE_GROUPS = [
  { id: 'pecho', label: 'Pecho', values: ['pectorals', 'serratus anterior'] },
  { id: 'espalda', label: 'Espalda', values: ['lats', 'upper back', 'traps', 'spine', 'levator scapulae'] },
  { id: 'piernas', label: 'Piernas', values: ['quads', 'hamstrings', 'glutes', 'calves', 'adductors', 'abductors'] },
  { id: 'hombros', label: 'Hombros', values: ['delts'] },
  { id: 'brazos', label: 'Brazos', values: ['biceps', 'triceps', 'forearms'] },
  { id: 'core', label: 'Core', values: ['abs'] },
  { id: 'cardio', label: 'Cardio', values: ['cardiovascular system'] },
];

export const EQUIP_GROUPS = [
  { id: 'barra', label: 'Barra', values: ['barbell', 'olympic barbell', 'ez barbell', 'trap bar', 'smith machine'] },
  { id: 'mancuernas', label: 'Mancuernas', values: ['dumbbell'] },
  { id: 'corporal', label: 'Peso corporal', values: ['body weight', 'assisted', 'weighted'] },
  { id: 'polea', label: 'Polea', values: ['cable', 'rope'] },
  { id: 'maquina', label: 'Máquina', values: ['leverage machine', 'sled machine', 'elliptical machine', 'stationary bike', 'stepmill machine', 'skierg machine', 'upper body ergometer'] },
  { id: 'bandas', label: 'Bandas', values: ['band', 'resistance band'] },
  { id: 'otros', label: 'Pesa rusa y balones', values: ['kettlebell', 'stability ball', 'medicine ball', 'bosu ball', 'roller', 'wheel roller', 'tire', 'hammer'] },
];

const fold = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const groupValues = (groups, id) => groups.find(g => g.id === id)?.values || null;

/** Search is accent-insensitive and matches Spanish or English names; every word must appear. */
export function filterCatalog(exercises, { search = '', muscle = 'all', equip = 'all' } = {}) {
  const muscles = muscle === 'all' ? null : groupValues(MUSCLE_GROUPS, muscle);
  const equips = equip === 'all' ? null : groupValues(EQUIP_GROUPS, equip);
  const words = fold(search).split(/\s+/).filter(Boolean);
  return exercises.filter(e => {
    if (muscles && !muscles.includes(fold(e.target_muscle))) return false;
    if (equips && !equips.includes(fold(e.equipment))) return false;
    if (words.length === 0) return true;
    const hay = fold(`${e.name_local} ${e.name_technical}`);
    return words.every(w => hay.includes(w));
  });
}

// Spanish display labels for individual dataset values.
export const MUSCLE_LABELS = {
  abductors: 'Abductores', abs: 'Abdominales', adductors: 'Aductores',
  biceps: 'Bíceps', calves: 'Pantorrillas', 'cardiovascular system': 'Cardio',
  delts: 'Hombros', forearms: 'Antebrazos', glutes: 'Glúteos',
  hamstrings: 'Isquiotibiales', lats: 'Dorsales', 'levator scapulae': 'Elev. Escápula',
  pectorals: 'Pectorales', quads: 'Cuádriceps', 'serratus anterior': 'Serrato',
  spine: 'Espinales', traps: 'Trapecios', triceps: 'Tríceps', 'upper back': 'Espalda Alta',
};
export const EQUIP_LABELS = {
  assisted: 'Asistido', band: 'Banda', barbell: 'Barra', 'body weight': 'Peso Corp.',
  'bosu ball': 'Bosu', cable: 'Polea', dumbbell: 'Mancuerna',
  'elliptical machine': 'Elíptica', 'ez barbell': 'Barra EZ', hammer: 'Martillo',
  kettlebell: 'Pesa Rusa', 'leverage machine': 'Máquina', 'medicine ball': 'Balón Med',
  'olympic barbell': 'Barra Olímpica', 'resistance band': 'Banda Resist.', roller: 'Rodillo',
  rope: 'Cuerda', 'skierg machine': 'Esquiador', 'sled machine': 'Trineo',
  'smith machine': 'Smith', 'stability ball': 'Balón Estab.',
  'stationary bike': 'Bici Fija', 'stepmill machine': 'Escaladora', tire: 'Llanta',
  'trap bar': 'Barra Hex', 'upper body ergometer': 'Ergómetro', weighted: 'Lastrado',
  'wheel roller': 'Rueda Abd.',
};

// Extra names used in muscle_group / secondary_muscles that aren't target values.
const EXTRA_MUSCLES = {
  quadriceps: 'Cuádriceps', core: 'Core', shoulders: 'Hombros', chest: 'Pecho', back: 'Espalda',
  'lower back': 'Zona lumbar', obliques: 'Oblicuos', hip: 'Cadera', hips: 'Cadera', 'hip flexors': 'Flexores de cadera',
  'rear deltoids': 'Deltoides posterior', rhomboids: 'Romboides', 'rotator cuff': 'Manguito rotador',
  wrists: 'Muñecas', ankles: 'Tobillos', groin: 'Ingle', 'inner thighs': 'Aductores', 'upper chest': 'Pecho superior',
  sternocleidomastoid: 'Cuello', trapezius: 'Trapecios', deltoids: 'Hombros', latissimus: 'Dorsales',
};

/** Spanish label for any muscle string from the dataset; unknown values are capitalised as-is. */
export function muscleLabel(m) {
  const key = String(m || '').toLowerCase().trim();
  const label = MUSCLE_LABELS[key] || EXTRA_MUSCLES[key];
  return label || (key ? key[0].toUpperCase() + key.slice(1) : '');
}
