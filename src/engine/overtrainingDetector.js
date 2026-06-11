export function detectOvertraining(player) {
  if (!player) return null;

  const warnings = [];
  const wellnessLogs = player.wellnessLogs || [];
  const workoutLogs = player.workoutLog || [];
  const recentWellness = wellnessLogs.slice(-5);
  const recentWorkouts = workoutLogs.filter(w => {
    const d = new Date(w.date);
    return d > new Date(Date.now() - 7 * 86400000);
  });

  if (recentWellness.length >= 3) {
    const avgSleep = recentWellness.reduce((s, l) => s + (l.sleep || l.sleep_quality || 0), 0) / recentWellness.length;
    const avgSoreness = recentWellness.reduce((s, l) => s + (l.soreness || l.muscle_soreness || 0), 0) / recentWellness.length;
    const avgStress = recentWellness.reduce((s, l) => s + (l.stress || l.stress_level || 0), 0) / recentWellness.length;

    if (avgSleep < 2.5) warnings.push({ severity: 'alta', icon: '😴', text: `Sueño crítico (${avgSleep.toFixed(1)}/5) — riesgo alto de fatiga crónica` });
    if (avgSoreness > 3.5) warnings.push({ severity: 'alta', icon: '🩹', text: `Dolor muscular alto (${avgSoreness.toFixed(1)}/5) — requiere recuperación activa` });
    if (avgStress > 3.5) warnings.push({ severity: 'media', icon: '🧠', text: `Estrés elevado (${avgStress.toFixed(1)}/5) — considerar carga mental reducida` });
    if (avgSleep < 3 && avgSoreness > 3) warnings.push({ severity: 'alta', icon: '🚨', text: 'Combinación sueño bajo + dolor alto — recomendar descanso 24-48h' });
  }

  if (recentWorkouts.length >= 4) {
    const totalSessions = recentWorkouts.length;
    const consecutiveDays = new Set(recentWorkouts.map(w => w.date)).size;
    if (consecutiveDays >= 5) warnings.push({ severity: 'media', icon: '📊', text: `${consecutiveDays} días consecutivos de entreno — riesgo de sobreentrenamiento` });
    if (totalSessions > 7) warnings.push({ severity: 'media', icon: '⚡', text: `${totalSessions} sesiones en 7 días — exceso de volumen` });
  }

  const hasActiveInjury = player.injuryLog && player.injuryLog.length > 0 && player.estado === 'lesionado';
  if (hasActiveInjury && recentWorkouts.length > 2) {
    warnings.push({ severity: 'alta', icon: '⚠️', text: 'Entrenando con lesión activa — riesgo de agravamiento' });
  }

  if (warnings.length === 0) return null;

  const maxSeverity = warnings.some(w => w.severity === 'alta') ? 'alta' : 'media';
  return { maxSeverity, warnings };
}

export function getTeamOvertrainingRisk(players) {
  const results = [];
  players.forEach(p => {
    const detection = detectOvertraining(p);
    if (detection) results.push({ playerId: p.id, playerName: p.name, ...detection });
  });
  return results.sort((a, b) => a.severity === 'alta' ? -1 : 1);
}
