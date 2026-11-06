// Per-set logging (Hevy/Strong model). Pure helpers, no React.

export const SET_TYPES = {
  normal: { short: null, label: 'Efectiva', color: '#2EE57A' },
  warmup: { short: 'C', label: 'Calentamiento', color: '#ff9800' },
  failure: { short: 'F', label: 'Al fallo', color: '#FF5C4D' },
  drop: { short: 'D', label: 'Drop set', color: '#38bdf8' },
};
const CYCLE = ['normal', 'warmup', 'failure', 'drop'];

export const nextSetType = (type) => CYCLE[(CYCLE.indexOf(type) + 1) % CYCLE.length];
export const isEffective = (s) => s.type !== 'warmup';

export function buildInitialSets({ warmupSets = 0, sets = 3, reps = 10, weight = '' } = {}) {
  const row = (type) => ({ type, weight: weight === '' || weight == null ? '' : String(weight), reps: String(reps ?? ''), done: false });
  return [
    ...Array.from({ length: Math.max(0, warmupSets) }, () => row('warmup')),
    ...Array.from({ length: Math.max(1, sets) }, () => row('normal')),
  ];
}

const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

/**
 * Sets from the most recent session that included this exercise.
 * Falls back to synthesising rows from aggregate sets/reps/weight for logs saved before per-set logging.
 */
export function findPreviousSets(workoutLog = [], { exerciseId, name }) {
  for (let i = workoutLog.length - 1; i >= 0; i--) {
    const logs = workoutLog[i]?.exerciseLogs || workoutLog[i]?.ejercicios || [];
    const hit = Array.isArray(logs) && logs.find(l =>
      (exerciseId && l.exerciseId && l.exerciseId === exerciseId) || (name && norm(l.name) === norm(name)));
    if (!hit) continue;
    if (Array.isArray(hit.setLogs) && hit.setLogs.length > 0) {
      return hit.setLogs.filter(s => s.done !== false).map(s => ({ type: s.type || 'normal', weight: Number(s.weight) || 0, reps: Number(s.reps) || 0 }));
    }
    const count = Number(hit.sets) || 0;
    return Array.from({ length: count }, () => ({ type: 'normal', weight: Number(hit.weight) || 0, reps: Number(hit.reps) || 0 }));
  }
  return [];
}

/** Ghost value for row `index`: same-position effective set from last time (warm-ups matched to warm-ups). */
export function ghostFor(previous, currentSets, index) {
  const set = currentSets[index];
  if (!set) return null;
  const wantWarmup = set.type === 'warmup';
  const ordinal = currentSets.slice(0, index).filter(s => (s.type === 'warmup') === wantWarmup).length;
  return previous.filter(p => (p.type === 'warmup') === wantWarmup)[ordinal] || null;
}

/** A completed effective set beats last time: more weight, or same weight with more reps. */
export function isPR(set, ghost) {
  if (!set?.done || !ghost || set.type === 'warmup') return false;
  const w = Number(set.weight) || 0;
  const r = Number(set.reps) || 0;
  if (w <= 0 || r <= 0) return false;
  return w > ghost.weight || (w === ghost.weight && r > ghost.reps);
}

/** Aggregate fields kept for backward compatibility (analyzeProgress, older readers). */
export function summarizeSets(setLogs = []) {
  const done = setLogs.filter(s => s.done);
  const eff = done.filter(isEffective);
  return {
    sets: eff.length,
    warmupSets: done.length - eff.length,
    reps: eff.reduce((m, s) => Math.max(m, Number(s.reps) || 0), 0),
    weight: eff.reduce((m, s) => Math.max(m, Number(s.weight) || 0), 0) || null,
  };
}
