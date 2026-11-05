import { supabase } from '../supabaseClient.js';

export const CREST_BUCKET = 'crests';
export const CREST_MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = { 'image/png': 'png', 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/svg+xml': 'svg' };

// Legacy crests bundled with the app, used only until staff uploads one for that team.
const LEGACY_CRESTS = [{ match: 'guepardo', url: '/assets/guepardos_logo.png' }];

const normalize = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

/** "Guepardos Rugby Club" -> "GR"; "Trolls" -> "TR". */
export function crestInitials(name) {
  const words = normalize(name).replace(/[^a-z0-9 ]/g, ' ').split(/\s+/)
    .filter(w => w && !['de', 'del', 'la', 'los', 'las', 'el', 'rugby', 'club', 'rc'].includes(w));
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/** The rival record for a fixture: by rivalId first, then exact (accent-insensitive) name for legacy fixtures. */
export function findRivalForFixture(fixture, rivals = []) {
  if (!fixture) return null;
  if (fixture.rivalId) {
    const byId = rivals.find(r => r.id === fixture.rivalId);
    if (byId) return byId;
  }
  const opp = normalize(fixture.opponent);
  return opp ? rivals.find(r => normalize(r.name) === opp) || null : null;
}

/** Crest URL to show for a team, or null to render initials. Never falls back to the Orcos crest. */
export function resolveCrestUrl(team) {
  if (!team) return null;
  if (team.crestUrl || team.crest_url) return team.crestUrl || team.crest_url;
  const name = normalize(team.name);
  return LEGACY_CRESTS.find(l => name.includes(l.match))?.url || null;
}

export function validateCrestFile(file) {
  if (!file) return 'No se seleccionó ningún archivo.';
  if (!ALLOWED[file.type]) return 'Formato no válido. Usa PNG, WEBP, JPG o SVG.';
  if (file.size > CREST_MAX_BYTES) return 'El escudo pesa más de 2 MB.';
  return null;
}

/**
 * Uploads a crest under a unique name (so phones never show a cached old crest)
 * and removes the previous one if it lived in our bucket. Returns the public URL.
 */
export async function uploadCrest(file, { kind, id, previousUrl }) {
  const problem = validateCrestFile(file);
  if (problem) throw new Error(problem);
  const path = `${kind}/${id}-${Date.now()}.${ALLOWED[file.type]}`;
  const { error } = await supabase.storage.from(CREST_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(error.message || 'No se pudo subir el escudo.');
  const { data } = supabase.storage.from(CREST_BUCKET).getPublicUrl(path);

  const marker = `/${CREST_BUCKET}/`;
  if (previousUrl && previousUrl.includes(marker)) {
    const oldPath = decodeURIComponent(previousUrl.split(marker)[1].split('?')[0]);
    supabase.storage.from(CREST_BUCKET).remove([oldPath]).catch(() => {});
  }
  return data.publicUrl;
}

/** All-time clan record from tournament_standings rows: { [teamId]: { won, drawn, lost, triesFor, played } }. */
export function aggregateClanRecords(standings = []) {
  return standings.reduce((acc, s) => {
    const r = acc[s.team_id] || { won: 0, drawn: 0, lost: 0, triesFor: 0, played: 0 };
    r.won += s.won || 0;
    r.drawn += s.drawn || 0;
    r.lost += s.lost || 0;
    r.triesFor += s.tries_for || 0;
    r.played += s.played || 0;
    acc[s.team_id] = r;
    return acc;
  }, {});
}
