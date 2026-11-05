// ── Motor de Calibración de Atributos Deportivos RPG ──
// Mapea perfiles World Rugby a estadísticas de combate (10-100)
// según posición oficial, biometría (peso/altura), edad y rendimiento en gimnasio/combine.

const POSITION_PROFILES = {
  pilar:         { force: 82, speed: 32, stamina: 52, technique: 38, refWeight: 112, refHeight: 1.80 },
  talonador:     { force: 72, speed: 42, stamina: 62, technique: 48, refWeight: 104, refHeight: 1.78 },
  segunda:       { force: 80, speed: 38, stamina: 58, technique: 42, refWeight: 110, refHeight: 1.96 },
  flanker:       { force: 64, speed: 64, stamina: 78, technique: 58, refWeight: 100, refHeight: 1.88 },
  octavo:        { force: 74, speed: 58, stamina: 70, technique: 54, refWeight: 106, refHeight: 1.92 },
  'medio scrum': { force: 38, speed: 82, stamina: 74, technique: 86, refWeight: 78,  refHeight: 1.72 },
  apertura:      { force: 44, speed: 76, stamina: 68, technique: 82, refWeight: 84,  refHeight: 1.80 },
  centro:        { force: 58, speed: 72, stamina: 66, technique: 68, refWeight: 94,  refHeight: 1.82 },
  wing:          { force: 46, speed: 88, stamina: 62, technique: 58, refWeight: 86,  refHeight: 1.80 },
  zaguero:       { force: 48, speed: 82, stamina: 70, technique: 72, refWeight: 88,  refHeight: 1.82 },
};

const DEFAULT_PROFILE = { force: 50, speed: 50, stamina: 55, technique: 50, refWeight: 90, refHeight: 1.78 };

/**
 * Normaliza nombres de posiciones sin importar acentos, inglés/español o abreviaturas
 */
export function normalizePosition(raw) {
  if (!raw) return '';
  const s = String(raw).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  if (s.includes('pilar') || s.includes('loosehead') || s.includes('tighthead')) return 'pilar';
  if (s.includes('talonador') || s.includes('hooker')) return 'talonador';
  if (s.includes('segunda') || s.includes('lock') || s.includes('2l')) return 'segunda';
  if (s.includes('flanker') || s.includes('ala (flanker)') || s.includes('tercera')) return 'flanker';
  if (s.includes('octavo') || s.includes('n8') || s.includes('number 8') || s.includes('no 8')) return 'octavo';
  if (s.includes('scrum') || s.includes('mele') || s.includes('medio')) return 'medio scrum';
  if (s.includes('apertura') || s.includes('fly') || s.includes('flyhalf') || s.includes('10')) return 'apertura';
  if (s.includes('centro') || s.includes('center')) return 'centro';
  if (s.includes('wing') || s.includes('ala')) return 'wing';
  if (s.includes('zaguero') || s.includes('fullback') || s.includes('15')) return 'zaguero';
  return s;
}

function getProfile(position) {
  const norm = normalizePosition(position);
  return POSITION_PROFILES[norm] || DEFAULT_PROFILE;
}

function clamp(v) {
  return Math.max(10, Math.min(100, Math.round(v)));
}

/**
 * Calcula atributos de guerrero (10 - 100) con calibración antropométrica y de fuerza
 */
export function calculateAttributes(player = {}) {
  const pos = player.posicion || player.position || '';
  const profile = getProfile(pos);

  let weight = Number(player.weight || player.weight_kg) || profile.refWeight;
  let height = Number(player.height || player.height_m) || profile.refHeight;

  // Si la altura viene en centímetros (ej. 182), normalizar a metros (1.82)
  if (height > 3) {
    height = height / 100;
  }

  const age = Number(player._meta?.age ?? player.age ?? 25);
  const gym = player.gymStats || {};

  const weightDelta = profile.refWeight > 0 ? (weight - profile.refWeight) / profile.refWeight : 0;
  const heightDelta = profile.refHeight > 0 ? (height - profile.refHeight) / profile.refHeight : 0;

  // Factor de madurez biológica
  let ageFactor = 1;
  if (age < 20) ageFactor = 0.7 + 0.3 * ((age - 16) / 4);
  else if (age > 28) ageFactor = Math.max(0.65, 1 - 0.02 * (age - 28));

  let force = profile.force + weightDelta * 40 + heightDelta * 15;
  let speed = profile.speed - weightDelta * 40 - heightDelta * 10;
  let stamina = profile.stamina - weightDelta * 20 - heightDelta * 8;
  let technique = profile.technique + (age > 28 ? (age - 28) * 1 : 0);

  // Aportes de Fuerza 1RM (Sentadilla, Peso Muerto, Press Banca)
  const squat = Number(gym.squat) || 0;
  const bench = Number(gym.bench) || 0;
  const deadlift = Number(gym.deadlift) || 0;

  if (squat > 0 && weight > 0) {
    const ratio = squat / weight;
    force += ratio > 1.5 ? 10 : ratio > 1.0 ? 5 : 0;
    stamina += ratio > 1.5 ? 3 : 0;
  }
  if (deadlift > 0 && weight > 0) {
    const ratio = deadlift / weight;
    force += ratio > 2.0 ? 8 : ratio > 1.5 ? 4 : 0;
  }
  if (bench > 0 && weight > 0) {
    const ratio = bench / weight;
    force += ratio > 1.0 ? 5 : ratio > 0.7 ? 2 : 0;
  }

  // Pruebas atléticas de campo si existen
  const fit = player.fitnessStats || player.athleticTest || {};
  if (fit.sprint) {
    const s = Number(fit.sprint);
    if (s > 0) speed += s < 4.8 ? 10 : s < 5.2 ? 5 : s > 5.8 ? -8 : 0;
  }
  if (fit.broncoSec || fit.bronco) {
    const b = Number(fit.broncoSec || fit.bronco);
    if (b > 0) stamina += b < 280 ? 10 : b < 305 ? 5 : b > 340 ? -8 : 0;
  }

  force = clamp(force * ageFactor);
  speed = clamp(speed * ageFactor);
  stamina = clamp(stamina * (ageFactor + (1 - ageFactor) * 0.5));
  technique = clamp(technique * (age > 28 ? ageFactor + 0.05 : 1));

  // Atributos extendidos RPG
  const tackle = clamp(force * 0.5 + technique * 0.3 + stamina * 0.2);
  const overall = clamp((force * 0.3) + (speed * 0.25) + (stamina * 0.25) + (technique * 0.2));

  return { force, speed, stamina, technique, tackle, overall };
}
