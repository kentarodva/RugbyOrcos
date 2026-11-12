/**
 * Estado de cuota de un jugador (auditoría, punto 10). Una sola regla para Tesorería,
 * la ficha, el panel del jugador, Paz y salvo y los premios.
 *
 * Desde la migración 92 la BD mantiene:
 *   memberships.due  = suma de los cobros mensuales (membership_charges)
 *   memberships.paid = suma de los pagos de mensualidad
 * Saldo = pagado - debido. Sin cobros no se debe nada.
 */
export const MEMBERSHIP_STATES = {
  aldia: { key: 'aldia', label: 'AL DÍA', color: 'var(--color-primary)', bg: 'rgba(46, 229, 122, 0.08)' },
  casi: { key: 'casi', label: 'CASI AL DÍA', color: 'var(--color-blue)', bg: 'rgba(64, 196, 255, 0.08)' },
  parcial: { key: 'parcial', label: 'PAGO PARCIAL', color: 'var(--color-gold)', bg: 'rgba(232, 185, 49, 0.08)' },
  moroso: { key: 'moroso', label: 'MOROSO', color: 'var(--color-red)', bg: 'rgba(255, 92, 77, 0.06)' },
};

const CASI_TOLERANCE = 2000;

export function membershipStatus(player, monthlyFee = 10000) {
  const m = player?.memberships || {};
  const due = Math.max(0, Number(m.due) || 0);
  const paid = Math.max(0, Number(m.paid) || 0);
  const owed = Math.max(0, due - paid);
  const fee = Number(monthlyFee) > 0 ? Number(monthlyFee) : 10000;
  const monthsOwed = owed > 0 ? Math.ceil(owed / fee) : 0;

  let state;
  if (owed <= 0) state = MEMBERSHIP_STATES.aldia;
  else if (owed <= CASI_TOLERANCE) state = MEMBERSHIP_STATES.casi;
  else if (owed < fee) state = MEMBERSHIP_STATES.parcial;
  else state = MEMBERSHIP_STATES.moroso;

  return {
    ...state,
    due, paid, owed, monthsOwed,
    credit: Math.max(0, paid - due),
    progress: due > 0 ? Math.min(100, (paid / due) * 100) : 100,
    lastPayment: m.lastPayment || null,
    lastAmount: m.lastAmount || null,
  };
}
