import React, { useState, useContext } from 'react';
import { ClubContext } from '../../context/ClubContext';
import { MENSUALIDAD_BASE, ABONOS_RAPIDOS } from './constants';

export function MembershipCard({ player, getMembershipStatus, onRequestConfirm, onRequestHistory, isStaff }) {
  const { getAssignments, campaigns } = useContext(ClubContext);
  const [customAmount, setCustomAmount] = useState('');
  const [fundraisingDebts, setFundraisingDebts] = useState(null);

  const m = player.memberships || { paid: 0, due: MENSUALIDAD_BASE };
  const due = m.due > 0 ? m.due : MENSUALIDAD_BASE;
  const paid = m.paid || 0;
  const remaining = Math.max(0, due - paid);
  const progress = Math.min(100, (paid / due) * 100);
  const status = getMembershipStatus(player);

  const handleLoadDebts = async () => {
    if (fundraisingDebts) return;
    const activeCampaigns = campaigns.filter(c => c.status === 'active');
    const all = [];
    for (const c of activeCampaigns) {
      const assignments = await getAssignments(c.id);
      const playerAssignments = assignments.filter(a => a.player_id === player.id);
      if (playerAssignments.length > 0) {
        all.push({ campaign: c, assignments: playerAssignments });
      }
    }
    setFundraisingDebts(all);
  };

  const handleQuickPay = (amount) => {
    onRequestConfirm(player, amount);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    const amount = Number(customAmount);
    if (!amount || amount <= 0) return;
    onRequestConfirm(player, amount);
    setCustomAmount('');
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: '12px',
      padding: '18px', background: 'rgba(255,255,255,0.01)',
      border: '1px solid ' + (status.color === 'var(--color-red)' ? 'rgba(255, 61, 0, 0.2)' : 'var(--border-glass)'),
      borderRadius: 'var(--radius-md)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <strong style={{ fontSize: '0.9rem' }}>{player.name}</strong>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', marginLeft: '6px' }}>
            "{player.apodo || ''}" | #{player.camiseta ?? '—'}
          </span>
        </div>
        <span style={{
          fontSize: '0.7rem', fontWeight: 800, padding: '3px 10px',
          borderRadius: 'var(--radius-sm)', color: status.color,
          background: status.bg, border: '1px solid ' + status.color
        }}>
          {status.label}
        </span>
      </div>

      <div style={{ background: 'var(--bg-dark)', borderRadius: '6px', height: '8px', overflow: 'hidden' }}>
        <div style={{
          width: `${progress}%`, height: '100%',
          background: progress >= 100 ? 'var(--color-primary)' : progress > 50 ? 'var(--color-gold)' : 'var(--color-red)',
          transition: 'width 0.3s ease'
        }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
        <span style={{ color: 'var(--color-primary)' }}>Pagado: ${paid.toLocaleString()}</span>
        <span style={{ color: remaining > 0 ? 'var(--color-red)' : 'var(--color-primary)' }}>
          {remaining > 0 ? `Pendiente: $${remaining.toLocaleString()}` : 'Completado'}
        </span>
      </div>

      {m.lastPayment && (
        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
          Ultimo abono: ${(m.lastAmount || 0).toLocaleString()} el {m.lastPayment}
        </div>
      )}

      {remaining > 0 && isStaff && (
        <div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '5px' }}>
            {ABONOS_RAPIDOS.map(amount => (
              <button
                key={amount}
                onClick={() => handleQuickPay(amount)}
                className="btn-outline"
                style={{
                  padding: '4px 8px', fontSize: '0.7rem',
                  color: 'var(--color-gold)', borderColor: 'var(--color-gold)'
                }}
              >
                ${amount.toLocaleString()}
              </button>
            ))}
          </div>
          <form onSubmit={handleCustomSubmit} style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="Otro monto"
              className="form-input"
              style={{ flex: 1, padding: '6px', fontSize: '0.75rem' }}
              min="500"
            />
            <button type="submit" className="btn-neon" style={{ padding: '6px 10px', fontSize: '0.7rem' }}>
              Abonar
            </button>
          </form>
        </div>
      )}

      <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '10px', marginTop: '5px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-gold)' }}>🎟️ Recaudación</span>
          <button
            onClick={() => onRequestHistory(player.id)}
            className="btn-outline"
            style={{ padding: '3px 8px', fontSize: '0.65rem' }}
          >
            📜 Historial
          </button>
        </div>
        <button
          onClick={handleLoadDebts}
          className="btn-outline"
          style={{ width: '100%', padding: '6px', fontSize: '0.7rem', marginTop: '6px', justifyContent: 'center' }}
        >
          {fundraisingDebts === null ? '🔄 Cargar deudas activas' :
            fundraisingDebts.length === 0 ? '✅ Sin deudas de recaudación' :
            fundraisingDebts.map(({ campaign: c, assignments: a }) =>
              `${c.name}: $${a.reduce((s, x) => s + Number(x.amount_paid), 0).toLocaleString()}/$${a.reduce((s, x) => s + Number(x.amount_due), 0).toLocaleString()}`
            ).join(' · ')
          }
        </button>
      </div>
    </div>
  );
}
