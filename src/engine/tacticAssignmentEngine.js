// Perfiles de atributos requeridos por posición y tipo de formación
// Cada peso suma 1.0 y representa la importancia relativa del atributo
const POSITION_REQUIREMENTS = {
  union: {
    1:  { force: 0.40, speed: 0.05, stamina: 0.25, technique: 0.30 },
    2:  { force: 0.30, speed: 0.10, stamina: 0.25, technique: 0.35 },
    3:  { force: 0.40, speed: 0.05, stamina: 0.25, technique: 0.30 },
    4:  { force: 0.35, speed: 0.10, stamina: 0.25, technique: 0.30 },
    5:  { force: 0.35, speed: 0.10, stamina: 0.25, technique: 0.30 },
    6:  { force: 0.30, speed: 0.20, stamina: 0.25, technique: 0.25 },
    7:  { force: 0.25, speed: 0.20, stamina: 0.30, technique: 0.25 },
    8:  { force: 0.30, speed: 0.15, stamina: 0.25, technique: 0.30 },
    9:  { force: 0.05, speed: 0.20, stamina: 0.20, technique: 0.55 },
    10: { force: 0.05, speed: 0.25, stamina: 0.20, technique: 0.50 },
    11: { force: 0.05, speed: 0.45, stamina: 0.20, technique: 0.30 },
    12: { force: 0.15, speed: 0.30, stamina: 0.20, technique: 0.35 },
    13: { force: 0.10, speed: 0.35, stamina: 0.20, technique: 0.35 },
    14: { force: 0.05, speed: 0.45, stamina: 0.20, technique: 0.30 },
    15: { force: 0.05, speed: 0.35, stamina: 0.20, technique: 0.40 },
  },
  sevens: {
    1:  { force: 0.20, speed: 0.30, stamina: 0.25, technique: 0.25 },
    2:  { force: 0.20, speed: 0.25, stamina: 0.30, technique: 0.25 },
    3:  { force: 0.20, speed: 0.30, stamina: 0.25, technique: 0.25 },
    9:  { force: 0.10, speed: 0.30, stamina: 0.25, technique: 0.35 },
    10: { force: 0.10, speed: 0.30, stamina: 0.25, technique: 0.35 },
    11: { force: 0.10, speed: 0.35, stamina: 0.25, technique: 0.30 },
    12: { force: 0.10, speed: 0.35, stamina: 0.25, technique: 0.30 },
  },
  league: {
    1:  { force: 0.35, speed: 0.15, stamina: 0.25, technique: 0.25 },
    2:  { force: 0.25, speed: 0.15, stamina: 0.30, technique: 0.30 },
    3:  { force: 0.35, speed: 0.15, stamina: 0.25, technique: 0.25 },
    4:  { force: 0.30, speed: 0.20, stamina: 0.25, technique: 0.25 },
    5:  { force: 0.30, speed: 0.20, stamina: 0.25, technique: 0.25 },
    8:  { force: 0.25, speed: 0.20, stamina: 0.25, technique: 0.30 },
    9:  { force: 0.05, speed: 0.25, stamina: 0.25, technique: 0.45 },
    10: { force: 0.05, speed: 0.30, stamina: 0.20, technique: 0.45 },
    11: { force: 0.10, speed: 0.40, stamina: 0.20, technique: 0.30 },
    12: { force: 0.15, speed: 0.30, stamina: 0.20, technique: 0.35 },
    13: { force: 0.15, speed: 0.30, stamina: 0.20, technique: 0.35 },
    14: { force: 0.10, speed: 0.40, stamina: 0.20, technique: 0.30 },
    15: { force: 0.10, speed: 0.35, stamina: 0.20, technique: 0.35 },
  },
};

const FORMATION_TYPE_MAP = {
  union: 'union', standard: 'union', scrum_attack: 'union',
  lineout_defense: 'union', defensive_wall: 'union',
  kickoff_receive: 'union', deep_attack: 'union', screen_defense: 'union',
  sevens: 'sevens',
  league_13s: 'league',
  custom: 'union',
};

// Mapear texto de posición de jugador a IDs de posición de rugby
const POSITION_NAME_TO_IDS = {
  pilar: [1, 3], 'pilar izquierdo': [1], 'pilar izq': [1], 'pilarizq': [1],
  'pilar derecho': [3], 'pilar der': [3], 'pilarder': [3],
  talonador: [2], hooker: [2],
  'segunda linea': [4, 5], 'segunda línea': [4, 5], lock: [4, 5],
  'second row': [4, 5],
  ala: [6, 7], flanker: [6, 7], flanco: [6, 7],
  'numero 8': [8], 'número 8': [8], octavo: [8], n8: [8], 'number 8': [8],
  'medio mele': [9], 'medio melé': [9], 'medio scrum': [9], 'scrum half': [9],
  'scrum-half': [9], mm: [9],
  apertura: [10], 'fly half': [10], 'fly-half': [10], ape: [10],
  wing: [11, 14], 'ala izquierdo': [11], 'ala izq': [11],
  'ala derecho': [14], 'ala der': [14],
  centro: [12, 13], 'primer centro': [12], 'segundo centro': [13],
  'inside centre': [12], 'outside centre': [13],
  zaguero: [15], fullback: [15], zag: [15],
};

function getSlotIdsForFormation(formationType) {
  if (formationType === 'sevens') return [1, 2, 3, 9, 10, 11, 12];
  if (formationType === 'league') return [1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 13, 14, 15];
  return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
}

function getPlayerPositionIds(player) {
  if (player.position_id) return [player.position_id];

  const posText = (player.posicion || player.position || '').toLowerCase().trim();
  if (!posText) return [];

  // Buscar match exacto
  if (POSITION_NAME_TO_IDS[posText]) return POSITION_NAME_TO_IDS[posText];

  // Buscar match parcial
  for (const [key, ids] of Object.entries(POSITION_NAME_TO_IDS)) {
    if (posText.includes(key)) return ids;
  }

  return [];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function scorePlayerForPosition(player, posId, reqs, matchStats = []) {
  const attrs = player.attributes || {};

  const baseScore =
    (attrs.force || 50) * reqs.force +
    (attrs.speed || 50) * reqs.speed +
    (attrs.stamina || 50) * reqs.stamina +
    (attrs.technique || 70) * reqs.technique;

  const playerPosIds = getPlayerPositionIds(player);
  const positionMatchBonus = playerPosIds.includes(posId) ? 12 : 0;

  let performanceBonus = 0;
  if (matchStats.length > 0) {
    const totalTackles = matchStats.reduce((s, m) => s + (m.tackles || 0), 0);
    const totalTries = matchStats.reduce((s, m) => s + (m.tries || 0), 0);
    const totalConversions = matchStats.reduce((s, m) => s + (m.conversions || 0), 0);
    const totalYellows = matchStats.reduce((s, m) => s + (m.yellowCards || m.yellow_cards || 0), 0);
    const totalReds = matchStats.reduce((s, m) => s + (m.redCards || m.red_cards || 0), 0);
    const count = matchStats.length;

    performanceBonus =
      clamp((totalTackles / count) * 0.8, 0, 6) +
      clamp((totalTries / count) * 4, 0, 6) +
      clamp((totalConversions / count) * 2, 0, 3) -
      (totalYellows * 2 + totalReds * 5);
  }

  return Math.round(clamp(baseScore + positionMatchBonus + performanceBonus, 0, 100));
}

// Hungarian Algorithm para asignación óptima global
// Minimiza el costo total = maximiza el score total
function hungarianAlgorithm(costMatrix) {
  const n = costMatrix.length;
  if (n === 0) return [];
  const m = costMatrix[0].length;

  const u = new Array(n + 1).fill(0);
  const v = new Array(m + 1).fill(0);
  const p = new Array(m + 1).fill(0);
  const way = new Array(m + 1).fill(0);

  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Array(m + 1).fill(Infinity);
    const used = new Array(m + 1).fill(false);

    do {
      used[j0] = true;
      let i0 = p[j0];
      let delta = Infinity;
      let j1 = 0;

      for (let j = 1; j <= m; j++) {
        if (!used[j]) {
          const cur = costMatrix[i0 - 1][j - 1] - u[i0] - v[j];
          if (cur < minv[j]) {
            minv[j] = cur;
            way[j] = j0;
          }
          if (minv[j] < delta) {
            delta = minv[j];
            j1 = j;
          }
        }
      }

      for (let j = 0; j <= m; j++) {
        if (used[j]) {
          u[p[j]] += delta;
          v[j] -= delta;
        } else {
          minv[j] -= delta;
        }
      }

      j0 = j1;
    } while (p[j0] !== 0);

    do {
      const j1 = way[j0];
      p[j0] = p[j1];
      j0 = j1;
    } while (j0 !== 0);
  }

  const result = new Array(n).fill(-1);
  for (let j = 1; j <= m; j++) {
    if (p[j] > 0) {
      result[p[j] - 1] = j - 1;
    }
  }
  return result;
}

function filterMatchStats(matchStats, filters = {}) {
  let filtered = [...matchStats];

  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom);
    filtered = filtered.filter(m => new Date(m.match_date || m.date) >= from);
  }
  if (filters.dateTo) {
    const to = new Date(filters.dateTo);
    filtered = filtered.filter(m => new Date(m.match_date || m.date) <= to);
  }

  // Ordenar por fecha descendente
  filtered.sort((a, b) => new Date(b.match_date || b.date) - new Date(a.match_date || a.date));

  if (filters.limit && filters.limit > 0 && filtered.length > filters.limit) {
    filtered = filtered.slice(0, filters.limit);
  }

  return filtered;
}

export function autoAssignLineup(players, matchStatsByPlayer, formationType, positionDefs, filters = {}) {
  if (!players || players.length === 0) return {};

  const formation = FORMATION_TYPE_MAP[formationType] || 'union';
  const reqs = POSITION_REQUIREMENTS[formation];
  if (!reqs) return {};

  const slotIds = getSlotIdsForFormation(formation);
  const activePlayers = players.filter(p =>
    p.estado === 'activo' || p.status === 'activo' || !p.estado
  );

  if (activePlayers.length === 0) return {};

  const nSlots = slotIds.length;
  const nPlayers = activePlayers.length;

  // Construir matriz de score [players x slots] y encontrar el máximo
  const scores = [];
  let maxScore = 0;

  for (let i = 0; i < nPlayers; i++) {
    scores[i] = [];
    const playerMatchStats = matchStatsByPlayer
      ? filterMatchStats(matchStatsByPlayer[activePlayers[i].id] || [], filters)
      : [];

    for (let j = 0; j < nSlots; j++) {
      const score = scorePlayerForPosition(activePlayers[i], slotIds[j], reqs, playerMatchStats);
      scores[i][j] = score;
      if (score > maxScore) maxScore = score;
    }
  }

  // Convertir score a costo: costo = maxScore - score
  const costMatrix = [];
  for (let i = 0; i < nPlayers; i++) {
    costMatrix[i] = [];
    for (let j = 0; j < nSlots; j++) {
      costMatrix[i][j] = maxScore - scores[i][j];
    }
  }

  // Hacer la matriz cuadrada para Hungarian
  const size = Math.max(nPlayers, nSlots);
  for (let i = 0; i < size; i++) {
    if (!costMatrix[i]) {
      costMatrix[i] = new Array(size).fill(maxScore);
    }
    for (let j = nSlots; j < size; j++) {
      costMatrix[i][j] = maxScore;
    }
  }

  const assignment = hungarianAlgorithm(costMatrix);

  // Construir resultado: solo asignaciones reales (no dummy)
  const lineup = {};
  for (let i = 0; i < nPlayers; i++) {
    const slotIndex = assignment[i];
    if (slotIndex >= 0 && slotIndex < nSlots) {
      lineup[slotIds[slotIndex]] = activePlayers[i].id;
    }
  }

  return lineup;
}

export function getSlotAccuracy(lineup, players, matchStatsByPlayer, formationType, filters = {}) {
  const formation = FORMATION_TYPE_MAP[formationType] || 'union';
  const reqs = POSITION_REQUIREMENTS[formation];
  if (!reqs) return {};

  const results = {};
  const playerMap = {};
  players.forEach(p => { playerMap[p.id] = p; });

  for (const [posId, playerId] of Object.entries(lineup)) {
    const player = playerMap[playerId];
    if (!player) continue;

    const req = reqs[Number(posId)];
    if (!req) continue;

    const stats = matchStatsByPlayer
      ? filterMatchStats(matchStatsByPlayer[playerId] || [], filters)
      : [];

    results[posId] = {
      playerName: player.name || player.nombre,
      score: scorePlayerForPosition(player, Number(posId), req, stats),
      attributes: {
        force: player.attributes?.force || 50,
        speed: player.attributes?.speed || 50,
        stamina: player.attributes?.stamina || 50,
        technique: player.attributes?.technique || 70,
      },
    };
  }

  return results;
}
