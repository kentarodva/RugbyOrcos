/**
 * La ficha del usuario que está mirando (auditoría, punto 7). Una sola regla para
 * todas las pantallas, igual que current_player_id() en la BD (migración 91):
 *   1. la ficha cuya cuenta (userId) es la del usuario;
 *   2. si no hay, la ficha con su mismo email exacto.
 * Nunca por nombre: dos jugadores pueden llamarse igual y se abriría una ficha ajena.
 * Desde la migración 91, players.user_id ya no es "quien creó la ficha".
 */
export function findOwnPlayer(players, user) {
  if (!user || !Array.isArray(players) || players.length === 0) return null;
  const active = players.filter(p => !p.deletedAt && !p.deleted_at);
  if (user.id) {
    const byAccount = active.find(p => (p.userId || p.user_id) === user.id);
    if (byAccount) return byAccount;
  }
  const email = user.email?.trim().toLowerCase();
  if (!email) return null;
  return active.find(p =>
    [p.contacto?.email, p.email].some(e => typeof e === 'string' && e.trim().toLowerCase() === email)
  ) || null;
}
