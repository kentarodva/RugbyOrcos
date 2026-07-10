export function analyzeProgress(currentLogs = [], previousLogs = []) {
  if (!currentLogs.length || !previousLogs.length) return null;

  const prevMap = {};
  previousLogs.forEach(e => {
    const key = e.name || e.exerciseId;
    if (key) prevMap[key] = e;
  });

  const improvements = [];
  const declines = [];
  const same = [];
  const newExercises = [];

  currentLogs.forEach(e => {
    const key = e.name || e.exerciseId;
    if (!key) return;
    const prev = prevMap[key];
    if (!prev) {
      newExercises.push(e.name || key);
      return;
    }

    const prevWeight = Number(prev.weight) || 0;
    const currWeight = Number(e.weight) || 0;
    const prevTotal = (prev.sets || 0) * (prev.reps || 0);
    const currTotal = (e.sets || 0) * (e.reps || 0);

    if (currWeight > prevWeight + 1) {
      improvements.push(`${e.name || key}: +${Math.round(currWeight - prevWeight)}kg (${prevWeight}→${currWeight}kg)`);
    } else if (currTotal > prevTotal && currWeight >= prevWeight - 1) {
      improvements.push(`${e.name || key}: +${currTotal - prevTotal} reps totales (${prev.sets}x${prev.reps}→${e.sets}x${e.reps})`);
    } else if (currWeight < prevWeight - 1 && currTotal < prevTotal) {
      declines.push(`${e.name || key}: bajó de ${prevWeight}kg a ${currWeight}kg, ${prev.sets}x${prev.reps}→${e.sets}x${e.reps}`);
    } else {
      same.push(e.name || key);
    }
  });

  const dropped = Object.keys(prevMap).filter(k => !currentLogs.find(e => (e.name || e.exerciseId) === k));

  return {
    improvements,
    declines,
    same,
    newExercises,
    dropped,
    summary: buildSummary(improvements, declines, newExercises, dropped),
    isProgress: improvements.length > declines.length,
    isStagnation: improvements.length === 0 && declines.length === 0 && newExercises.length === 0,
  };
}

function buildSummary(improvements, declines, newEx, dropped) {
  const parts = [];
  if (improvements.length > 0) {
    parts.push(`📈 Progreso en ${improvements.length} ejercicio(s): ${improvements.slice(0, 2).join(', ')}${improvements.length > 2 ? ` y ${improvements.length - 2} más` : ''}`);
  }
  if (newEx.length > 0) {
    parts.push(`🆕 ${newEx.length} ejercicio(s) nuevo(s) esta sesión`);
  }
  if (declines.length > 0) {
    parts.push(`⚠️ Bajó en ${declines.length} ejercicio(s). ¿Fatiga o lesión?`);
  }
  if (dropped.length > 0 && improvements.length === 0) {
    parts.push(`💡 No hiciste ${dropped.slice(0, 2).join(', ')}${dropped.length > 2 ? ` y ${dropped.length - 2} más` : ''} — ¿ajustamos el plan?`);
  }
  if (parts.length === 0 && newEx.length === 0) {
    parts.push('Rendimiento similar a la sesión anterior. Consistencia sólida.');
  }
  return parts.join('. ');
}
