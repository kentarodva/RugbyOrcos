import React, { useState, useContext } from 'react';
import { ClubContext } from '../../context/ClubContext';
import { useToast } from '../../context/ToastContext';

export function RegisterPaymentModal({ assignment, campaign, players, onClose, registerPayment, readOnly }) {
  const { addFinanceRecord, activeTeam } = useContext(ClubContext);
  const { showToast } = useToast();
  const player = players.find(p => p.id === assignment.player_id);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const remaining = Number(assignment.amount_due) - Number(assignment.amount_paid);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payAmount = Number(amount);
    if (!payAmount || payAmount <= 0) {
      showToast('Ingresa un monto válido.', 'warning');
      return;
    }
    if (payAmount > remaining) {
      showToast(`El monto excede el saldo pendiente ($${remaining.toLocaleString()}).`, 'warning');
      return;
    }

    try {
      await registerPayment({
        playerId: assignment.player_id,
        amount: payAmount,
        source: 'fundraising',
        assignmentId: assignment.id,
        campaignId: campaign.id,
        notes: notes.trim(),
      });

      await addFinanceRecord({
        desc: `${campaign.type === 'raffle' ? '🎟️' : '🍲'} ${campaign.name} - ${player?.name || 'Jugador'}${notes ? ' (' + notes + ')' : ''}`,
        amount: payAmount,
        type: 'ingreso',
        category: 'general',
        date: new Date().toISOString().split('T')[0],
      });

      showToast(`Pago de $${payAmount.toLocaleString()} registrado.`, 'success');
      onClose();
    } catch (err) {
      showToast('Error al registrar el pago. Intenta de nuevo.', 'error');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animated-slide" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'Outfit' }}>💰 Registrar Pago</h3>
          <button onClick={onClose} className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>✕</button>
        </div>

        <div style={{ fontSize: '0.9rem', marginBottom: '15px' }}>
          <p><strong>{player?.name || '—'}</strong> {player?.apodo && `"${player.apodo}"`}</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{campaign.name}</p>
          <div style={{ display: 'flex', gap: '15px', marginTop: '8px', fontSize: '0.85rem' }}>
            <span>Debe: <strong>${Number(assignment.amount_due).toLocaleString()}</strong></span>
            <span>Pagado: <strong style={{ color: 'var(--color-primary)' }}>${Number(assignment.amount_paid).toLocaleString()}</strong></span>
            <span>Saldo: <strong style={{ color: remaining > 0 ? 'var(--color-red)' : 'var(--color-primary)' }}>${remaining.toLocaleString()}</strong></span>
          </div>
        </div>

        {readOnly ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '15px' }}>
            Solo puedes ver la información. Contacta al tesorero para registrar pagos.
          </p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div className="form-group">
              <label>Monto a Pagar ($)</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder={`Máx: $${remaining.toLocaleString()}`} className="form-input" min="1" max={remaining} required />
            </div>
            <div className="form-group">
              <label>Nota (opcional)</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ej. Pagó con billete de 50k" className="form-input" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={onClose} className="btn-outline">Cancelar</button>
              <button type="submit" className="btn-neon">✅ Registrar Pago</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
