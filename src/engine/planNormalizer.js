export function normalizeAIOutput(aiPlan, player) {
  if (!aiPlan?.plan) return null;

  const categories = {
    campo: normalizeExercises(aiPlan.plan.campo, 'campo', player),
    gym: normalizeExercises(aiPlan.plan.gimnasio || aiPlan.plan.gym, 'gym', player),
    recuperacion: normalizeExercises(aiPlan.plan.recuperacion, 'recuperacion', player),
  };

  return {
    ...aiPlan,
    plan: categories,
    fromAI: true,
    enrichedByAI: true,
  };
}

function normalizeExercises(exercises, category, player) {
  if (!Array.isArray(exercises)) return [];
  return exercises.map((ex, i) => {
    const sets = parseSets(ex.sets || ex.series);
    const oneRM = calculateOneRM(ex, player, category);
    return {
      id: `ai_${Date.now()}_${i}`,
      name: ex.nombre || ex.name || 'Ejercicio',
      category,
      sets: sets.count,
      reps: sets.reps,
      loadPercentage: ex.carga || ex.loadPercentage || null,
      oneRMWeight: oneRM,
      aiReason: ex.razon || ex.aiReason || '',
      drills: parseDrills(ex.descripcion || ex.drills),
      durationMin: parseInt(ex.duracion || ex.durationMin || 0) || null,
      fromAI: true,
    };
  });
}

export function normalizeEngineOutput(enginePlan) {
  if (!enginePlan?.plan) return null;
  return {
    ...enginePlan,
    plan: {
      campo: (enginePlan.plan.campo || []).map(ex => ({ ...ex, fromAI: false })),
      gym: (enginePlan.plan.gym || []).map(ex => ({ ...ex, fromAI: false })),
      recuperacion: (enginePlan.plan.recuperacion || []).map(ex => ({ ...ex, fromAI: false })),
    },
    fromAI: false,
  };
}

function calculateOneRM(ex, player, category) {
  if (category !== 'gym') return null;
  if (ex.oneRMWeight) return ex.oneRMWeight;
  const gym = player?.gymStats || {};
  if (ex.carga?.includes('sentadilla') || ex.name?.toLowerCase().includes('sentadilla')) return gym.squat || 0;
  if (ex.carga?.includes('banca') || ex.name?.toLowerCase().includes('banca')) return gym.bench || 0;
  if (ex.carga?.includes('peso muerto') || ex.name?.toLowerCase().includes('deadlift')) return gym.deadlift || 0;
  return null;
}

function parseSets(input) {
  if (!input) return { count: 3, reps: 10 };
  const str = String(input);
  const m = str.match(/(\d+)\s*x\s*(\d+)/);
  if (m) return { count: parseInt(m[1]), reps: parseInt(m[2]) };
  return { count: parseInt(str) || 3, reps: 10 };
}

function parseDrills(input) {
  if (Array.isArray(input)) return input;
  if (typeof input === 'string') return input.split('\n').filter(Boolean).map(s => s.replace(/^[-•]\s*/, '').trim());
  return [];
}
