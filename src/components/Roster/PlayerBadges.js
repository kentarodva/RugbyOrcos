const getPlayerBadges = (player) => {
  const list = [];
  if (!player || player.rol === 'Entrenador') return list;

  const attRate = player.attendance.total > 0 ? (player.attendance.present / player.attendance.total) : 0;
  if (player.attendance.total >= 5 && attRate >= 0.9) {
    list.push({ icon: '🌟', name: 'Orco de Hierro', color: 'var(--color-gold)', desc: 'Asistencia perfecta (>=90%)' });
  }

  const stats = player.matchStats || [];
  const totalTackles = stats.reduce((sum, s) => sum + (s.tackles || 0), 0);
  const maxTacklesSingleMatch = stats.reduce((max, s) => Math.max(max, s.tackles || 0), 0);
  if (totalTackles >= 12 || maxTacklesSingleMatch >= 8) {
    list.push({ icon: '🛡️', name: 'Muralla Verde', color: 'var(--color-primary)', desc: 'Alta efectividad de tackle' });
  }

  const totalTries = stats.reduce((sum, s) => sum + (s.tries || 0), 0);
  if (totalTries >= 3) {
    list.push({ icon: '🏉', name: 'Demoledor', color: 'var(--color-red)', desc: 'Maximo anotador de tries (>=3)' });
  }

  const totalMvps = stats.filter(s => s.mvp).length;
  if (totalMvps >= 1) {
    list.push({ icon: '🏆', name: 'Gladiador (MVP)', color: 'var(--color-yellow)', desc: 'Elegido jugador del partido' });
  }

  return list;
};

export default getPlayerBadges;
