const POSITION_PROFILES = {
  'Pilar':       { force: 80, speed: 30, stamina: 50, technique: 35, refWeight: 115, refHeight: 1.80 },
  'Talonador':   { force: 70, speed: 40, stamina: 60, technique: 45, refWeight: 105, refHeight: 1.78 },
  'Segunda Linea': { force: 78, speed: 35, stamina: 55, technique: 40, refWeight: 112, refHeight: 1.98 },
  'Flanker':     { force: 60, speed: 60, stamina: 75, technique: 55, refWeight: 102, refHeight: 1.90 },
  'Octavo':      { force: 70, speed: 55, stamina: 68, technique: 50, refWeight: 108, refHeight: 1.93 },
  'Medio Mele':  { force: 35, speed: 80, stamina: 72, technique: 85, refWeight: 78,  refHeight: 1.72 },
  'Apertura':    { force: 40, speed: 75, stamina: 65, technique: 80, refWeight: 85,  refHeight: 1.80 },
  'Centro':      { force: 55, speed: 70, stamina: 65, technique: 65, refWeight: 95,  refHeight: 1.83 },
  'Ala':         { force: 45, speed: 85, stamina: 60, technique: 55, refWeight: 88,  refHeight: 1.80 },
  'Zaguero':     { force: 45, speed: 80, stamina: 68, technique: 70, refWeight: 90,  refHeight: 1.83 },
};

const DEFAULT_PROFILE = { force: 50, speed: 50, stamina: 55, technique: 50, refWeight: 90, refHeight: 1.78 };

function getProfile(position) {
  const key = Object.keys(POSITION_PROFILES).find(k => position?.toLowerCase().includes(k.toLowerCase()));
  return key ? POSITION_PROFILES[key] : DEFAULT_PROFILE;
}

function clamp(v) {
  return Math.max(10, Math.min(100, Math.round(v)));
}

export function calculateAttributes(player) {
  const pos = player.posicion || player.position || '';
  const profile = getProfile(pos);
  const weight = player.weight || player.weight_kg || profile.refWeight;
  const height = player.height || player.height_m || profile.refHeight;
  const age = player._meta?.age ?? player.age ?? 25;
  const gym = player.gymStats || {};

  const weightDelta = profile.refWeight > 0 ? (weight - profile.refWeight) / profile.refWeight : 0;
  const heightDelta = profile.refHeight > 0 ? (height - profile.refHeight) / profile.refHeight : 0;

  let ageFactor = 1;
  if (age < 20) ageFactor = 0.7 + 0.3 * ((age - 16) / 4);
  else if (age > 28) ageFactor = Math.max(0.65, 1 - 0.02 * (age - 28));

  let force = profile.force
    + weightDelta * 40
    + heightDelta * 15;

  let speed = profile.speed
    - weightDelta * 40
    - heightDelta * 10;

  let stamina = profile.stamina
    - weightDelta * 20
    - heightDelta * 8;

  let technique = profile.technique
    + (age > 28 ? (age - 28) * 1 : 0);

  if (gym.squat && weight > 0) {
    const ratio = gym.squat / weight;
    force += ratio > 1.5 ? 10 : ratio > 1.0 ? 5 : 0;
    stamina += ratio > 1.5 ? 3 : 0;
  }
  if (gym.deadlift && weight > 0) {
    const ratio = gym.deadlift / weight;
    force += ratio > 2.0 ? 8 : ratio > 1.5 ? 4 : 0;
  }
  if (gym.bench && weight > 0) {
    const ratio = gym.bench / weight;
    force += ratio > 1.0 ? 5 : ratio > 0.7 ? 2 : 0;
  }

  force = clamp(force * ageFactor);
  speed = clamp(speed * ageFactor);
  stamina = clamp(stamina * (ageFactor + (1 - ageFactor) * 0.5));
  technique = clamp(technique * (age > 28 ? ageFactor + 0.05 : 1));

  return { force, speed, stamina, technique };
}
