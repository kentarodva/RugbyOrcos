import EXERCISE_LIBRARY from '../data/exerciseLibrary';
import FAULT_EXERCISE_MAP from '../data/faultExerciseMap';

const FORWARDS = ['Pilar', 'Talonador', 'Segunda Línea', 'Flanker', 'Octavo'];
const BACKS = ['Medio Melé', 'Apertura', 'Centro', 'Ala', 'Zaguero'];

const POSITION_BASE_EXERCISES = {
  forwards: ['scrum_empuje', 'ruck_cleanout', 'maul_defensivo', 'tackle_tecnico',
             'gym_sentadilla', 'gym_peso_muerto', 'gym_empuje_trineo', 'prev_cuello'],
  backs: ['pase_base', 'ataque_profundo', 'evasion_sidestep', 'tackle_persecucion',
          'gym_salto_cajon', 'gym_sprint_resistido', 'patada_tactica', 'gym_escalera'],
  captain: ['liderazgo_comunicacion', 'liderazgo_decisiones', 'defensa_linea'],
  coach: ['liderazgo_comunicacion']
};

const GYM_BASE_EXERCISES = {
  forwards: ['gym_sentadilla', 'gym_peso_muerto', 'gym_press_banca', 'gym_remo',
             'gym_empuje_trineo', 'gym_plancha', 'gym_prensa'],
  backs: ['gym_sentadilla_frontal', 'gym_peso_muerto', 'gym_dominadas', 'gym_power_clean',
          'gym_salto_cajon', 'gym_escalera', 'gym_cambio_direccion', 'gym_press_militar'],
  captain: ['gym_sentadilla', 'gym_press_banca', 'gym_dominadas', 'gym_pallof', 'gym_arranque'],
  coach: ['gym_plancha', 'gym_remo', 'gym_rueda', 'gym_pallof']
};

const RECOVERY_EXERCISES = ['rec_foam_roller', 'rec_estiramiento'];
const PREVENTION_EXERCISES = ['prev_hombros', 'prev_rodillas', 'prev_tobillos'];

function getPlayerCategory(player) {
  if (player.rol === 'Entrenador') return 'coach';
  if (player.rol === 'Capitán' || player.rol === 'Subcapitán') return 'captain';
  if (FORWARDS.includes(player.posicion)) return 'forwards';
  return 'backs';
}

function getExerciseById(id) {
  return EXERCISE_LIBRARY.find(ex => ex.id === id);
}

function getRecentlyDoneIds(workoutLog, days = 14) {
  if (!workoutLog || workoutLog.length === 0) return new Set();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const recentLogs = workoutLog.filter(log => new Date(log.date).getTime() > cutoff);
  const ids = new Set();
  recentLogs.forEach(log => {
    (log.ejercicios || []).forEach(e => ids.add(e.exerciseId));
  });
  return ids;
}

function analyzeMatchFaults(matchStats, player) {
  const faults = [];
  if (!matchStats || matchStats.length === 0) return faults;

  const recent = matchStats.slice(-3);
  const matchCount = recent.length;

  const totalTackles = recent.reduce((s, st) => s + (st.tackles || 0), 0);
  const missedTacklesEst = Math.round(totalTackles * 0.15);
  const totalTries = recent.reduce((s, st) => s + (st.tries || 0), 0);
  const totalConversions = recent.reduce((s, st) => s + (st.conversions || 0), 0);
  const totalTurnovers = recent.reduce((s, st) => s + (st.turnovers || 0), 0);
  const yellowCardsCount = recent.reduce((s, st) => s + (st.yellowCards || 0), 0);
  const redCardsCount = recent.reduce((s, st) => s + (st.redCards || 0), 0);

  const avgTackles = matchCount > 0 ? totalTackles / matchCount : 0;
  const avgTurnovers = matchCount > 0 ? totalTurnovers / matchCount : 0;

  if (FAULT_EXERCISE_MAP.missedTackles && avgTackles > 5 && missedTacklesEst > 2 && matchCount >= (FAULT_EXERCISE_MAP.missedTackles.minMatches || 1)) {
    faults.push('missedTackles');
  }

  if (FAULT_EXERCISE_MAP.lowTackleCount && avgTackles < 3 && matchCount >= (FAULT_EXERCISE_MAP.lowTackleCount.minMatches || 2)) {
    faults.push('lowTackleCount');
  }

  if (FAULT_EXERCISE_MAP.knockOns && avgTurnovers < 1 && matchCount >= 2 && totalTackles > 0) {
    faults.push('knockOns');
  }

  if (FAULT_EXERCISE_MAP.lowTries && totalTries === 0 && matchCount >= (FAULT_EXERCISE_MAP.lowTries.minMatches || 2)) {
    faults.push('lowTries');
  }

  if (FAULT_EXERCISE_MAP.lowTurnovers && avgTurnovers < 1 && matchCount >= (FAULT_EXERCISE_MAP.lowTurnovers.minMatches || 2)) {
    faults.push('lowTurnovers');
  }

  if (FAULT_EXERCISE_MAP.lowConversions && totalConversions === 0 && matchCount >= (FAULT_EXERCISE_MAP.lowConversions.minMatches || 2)) {
    faults.push('lowConversions');
  }

  if (FAULT_EXERCISE_MAP.yellowCards && yellowCardsCount > 0 && matchCount >= (FAULT_EXERCISE_MAP.yellowCards.minMatches || 1)) {
    faults.push('yellowCards');
  }

  if (FAULT_EXERCISE_MAP.redCards && redCardsCount > 0 && matchCount >= (FAULT_EXERCISE_MAP.redCards.minMatches || 1)) {
    faults.push('redCards');
  }

  if (FAULT_EXERCISE_MAP.missedPenalties && player.infractionLog && player.infractionLog.length > 0) {
    const recentInfractions = player.infractionLog.filter(inf => {
      const infDate = new Date(inf.date);
      const cutoff = Date.now() - 60 * 24 * 60 * 60 * 1000;
      return infDate.getTime() > cutoff;
    });
    const totalPenales = recentInfractions.reduce((s, inf) => s + (inf.penales || 0), 0);
    if (totalPenales >= 3 && matchCount >= (FAULT_EXERCISE_MAP.missedPenalties.minMatches || 2)) {
      faults.push('missedPenalties');
    }
  }

  if (FAULT_EXERCISE_MAP.lowStamina && player.wellnessLogs && player.wellnessLogs.length > 0) {
    const recentWellness = player.wellnessLogs.slice(-7);
    const avgSleep = recentWellness.reduce((s, w) => s + (w.sleep || 3), 0) / recentWellness.length;
    const avgSoreness = recentWellness.reduce((s, w) => s + (w.soreness || 3), 0) / recentWellness.length;
    if (avgSleep < 3 || avgSoreness > 3.5) {
      if (matchCount >= (FAULT_EXERCISE_MAP.lowStamina.minMatches || 2)) {
        faults.push('lowStamina');
      }
    }
  }

  if (FAULT_EXERCISE_MAP.poorKicking && player.posicion === 'Medio Melé' || player.posicion === 'Apertura' || player.posicion === 'Zaguero') {
    if (totalConversions === 0 && matchCount >= (FAULT_EXERCISE_MAP.poorKicking.minMatches || 2)) {
      if (!faults.includes('lowConversions')) {
        faults.push('poorKicking');
      }
    }
  }

  if (faults.length === 0) return [];

  return faults.sort((a, b) => {
    const pa = FAULT_EXERCISE_MAP[a]?.priority || 'low';
    const pb = FAULT_EXERCISE_MAP[b]?.priority || 'low';
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return (order[pa] ?? 3) - (order[pb] ?? 3);
  });
}

function calculateGymWeight(player, exerciseId, percentage) {
  if (!player.gymStats) return null;
  const { squat, bench, deadlift } = player.gymStats;
  const exercise = getExerciseById(exerciseId);
  if (!exercise) return null;

  if (exerciseId === 'gym_sentadilla' || exerciseId === 'gym_sentadilla_frontal' ||
      exerciseId === 'gym_prensa') {
    return squat > 0 ? Math.round(squat * percentage) : null;
  }
  if (exerciseId === 'gym_press_banca' || exerciseId === 'gym_press_militar') {
    return bench > 0 ? Math.round(bench * percentage) : null;
  }
  if (exerciseId === 'gym_peso_muerto') {
    return deadlift > 0 ? Math.round(deadlift * percentage) : null;
  }
  if (exerciseId === 'gym_power_clean' || exerciseId === 'gym_arranque') {
    return deadlift > 0 ? Math.round(deadlift * 0.55) : null;
  }
  return null;
}

const GYM_PERCENTAGES = {
  strength: 0.80,
  hypertrophy: 0.65,
  power: 0.70,
  endurance: 0.55
};

function selectExercises(pool, count, excludeIds) {
  return pool
    .map(id => getExerciseById(id))
    .filter(ex => ex && !excludeIds.has(ex.id))
    .slice(0, count);
}

export function generatePlan(player) {
  const category = getPlayerCategory(player);
  const excludeIds = getRecentlyDoneIds(player.workoutLog, 14);
  const matchFaults = analyzeMatchFaults(player.matchStats, player);
  const isInjured = player.estado === 'lesionado';
  const phase = player.injuryLog?.[0]?.phase || 1;

  let campoExercises = [];
  let gymExercises = [];
  let recuperacionExercises = [];

  if (isInjured) {
    recuperacionExercises = RECOVERY_EXERCISES.map(id => getExerciseById(id)).filter(Boolean);
    if (phase >= 2) {
      recuperacionExercises.push(
        ...PREVENTION_EXERCISES.map(id => getExerciseById(id)).filter(Boolean)
      );
    }
    if (phase >= 3) {
      const lightCampo = selectExercises(
        (POSITION_BASE_EXERCISES[category] || POSITION_BASE_EXERCISES.forwards).slice(0, 2),
        2, excludeIds
      );
      campoExercises = lightCampo;
    }
  } else {
    const basePool = POSITION_BASE_EXERCISES[category] || POSITION_BASE_EXERCISES.forwards;
    campoExercises = selectExercises(basePool, 3, excludeIds);

    const correctiveIds = [];
    const topFaults = matchFaults.slice(0, 3);
    topFaults.forEach(fault => {
      const mapping = FAULT_EXERCISE_MAP[fault];
      if (mapping) {
        mapping.corrective.forEach(id => {
          if (!correctiveIds.includes(id)) correctiveIds.push(id);
        });
      }
    });
    const correctiveExercises = selectExercises(correctiveIds, 3, excludeIds);
    campoExercises = [...campoExercises, ...correctiveExercises].slice(0, 5);

    const gymPool = GYM_BASE_EXERCISES[category] || GYM_BASE_EXERCISES.forwards;
    gymExercises = selectExercises(gymPool, 4, excludeIds);
  }

  if (recuperacionExercises.length === 0 && !isInjured) {
    recuperacionExercises = RECOVERY_EXERCISES.map(id => getExerciseById(id)).filter(Boolean);
  }

  const gymPlan = gymExercises.map(ex => {
    const weight = calculateGymWeight(player, ex.id, GYM_PERCENTAGES.strength);
    return {
      ...ex,
      oneRMWeight: weight,
      loadPercentage: weight ? Math.round(GYM_PERCENTAGES.strength * 100) + '% 1RM' : null
    };
  });

  return {
    playerId: player.id,
    playerName: player.name,
    category,
    isInjured,
    matchFaults: matchFaults.map(f => FAULT_EXERCISE_MAP[f]?.label || f),
    plan: {
      campo: campoExercises,
      gym: gymPlan,
      recuperacion: recuperacionExercises
    },
    generatedAt: new Date().toISOString()
  };
}

export function getExerciseByIdFn(id) {
  return getExerciseById(id);
}

export { EXERCISE_LIBRARY, POSITION_BASE_EXERCISES, GYM_BASE_EXERCISES, FORWARDS, BACKS };
