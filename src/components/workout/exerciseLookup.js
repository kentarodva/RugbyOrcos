import { getExerciseCatalog } from '../../services/trainingService';

const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * Matches a plan exercise (manual: has `code`; AI-generated: often only a name such as
 * "Sentadilla Frontal (Front Squat)") to a catalog row. Returns null when unsure.
 */
export function resolveCatalogExercise(planEx, catalog = []) {
  if (!planEx || catalog.length === 0) return null;
  if (planEx.code) {
    const byCode = catalog.find(c => c.code === planEx.code);
    if (byCode) return byCode;
  }
  const full = norm(planEx.name);
  const outside = norm((planEx.name || '').replace(/\(.*?\)/g, ''));
  const inside = norm(((planEx.name || '').match(/\(([^)]+)\)/) || [])[1]);
  const candidates = [full, outside, inside].filter(Boolean);
  for (const key of candidates) {
    const hit = catalog.find(c => norm(c.name_local) === key || norm(c.name_technical) === key);
    if (hit) return hit;
  }
  // Word match: "Front Squat" -> "barbell front squat". Needs >= 2 words to avoid false hits
  // ("Press" alone would match dozens); the shortest (most basic) variant wins.
  for (const key of candidates) {
    const words = key.split(' ');
    if (words.length < 2) continue;
    const hits = catalog.filter(c => [c.name_technical, c.name_local].some(n => {
      const have = norm(n).split(' ');
      return words.every(w => have.includes(w));
    }));
    if (hits.length) return hits.sort((x, y) => norm(x.name_technical).length - norm(y.name_technical).length)[0];
  }
  return null;
}

// One catalog fetch per session, shared by every "Ver técnica" tap. Reset on failure so it can retry.
let catalogPromise = null;
export function loadCatalogOnce() {
  if (!catalogPromise) {
    catalogPromise = getExerciseCatalog().catch((err) => { catalogPromise = null; throw err; });
  }
  return catalogPromise;
}
