import React, { useState, useContext } from 'react';
import { ClubContext } from '../../context/ClubContext';
import { useToast } from '../../context/ToastContext';

export function RaffleTicketModal({ campaign, assignment, tickets, onClose, readOnly }) {
  const { markTicketSold, registerPayment } = useContext(ClubContext);
  const { showToast } = useToast();
  const [soldName, setSoldName] = useState('');

  const soldCount = tickets.filter(t => t.is_sold).length;
  const totalCount = tickets.length;
  const ticketPrice = Number(campaign.ticket_price) || 0;

  const handleMarkSold = async (ticket) => {
    const name = soldName.trim() || `Comprador Boleto #${ticket.ticket_number}`;
    if (!name) {
      showToast('Ingresa el nombre del comprador.', 'warning');
      return;
    }
    try {
      await markTicketSold(ticket.id, name);

      if (ticketPrice > 0) {
        await registerPayment({
          playerId: assignment.player_id,
          amount: ticketPrice,
          source: 'fundraising',
          assignmentId: assignment.id,
          campaignId: campaign.id,
          notes: `Boleto #${ticket.ticket_number} vendido a ${name}`,
        });
      }

      showToast(`Boleto #${ticket.ticket_number} vendido a ${name}.`, 'success');
      setSoldName('');
    } catch (err) {
      showToast('Error al marcar como vendido.', 'error');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animated-slide" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>🎟️ Boletas — {campaign.name}</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Boletas {assignment.ticket_start}–{assignment.ticket_end} · {soldCount}/{totalCount} vendidas
              {ticketPrice > 0 && ` · $${ticketPrice.toLocaleString()} c/u`}
            </p>
          </div>
          <button onClick={onClose} className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>✕</button>
        </div>

        {!readOnly && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
            <input
              type="text"
              value={soldName}
              onChange={e => setSoldName(e.target.value)}
              placeholder="Nombre del comprador..."
              className="form-input"
              style={{ flex: 1, padding: '8px', fontSize: '0.85rem' }}
            />
          </div>
        )}

        <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {tickets.map(t => (
            <div key={t.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 12px', background: t.is_sold ? 'rgba(46, 229, 122, 0.05)' : 'rgba(255,255,255,0.02)',
              border: '1px solid ' + (t.is_sold ? 'rgba(46, 229, 122, 0.2)' : 'var(--border-glass)'),
              borderRadius: 'var(--radius-sm)', fontSize: '0.85rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <strong>#{String(t.ticket_number).padStart(3, '0')}</strong>
                {t.is_sold ? (
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>
                    → {t.sold_to_name} {t.sold_at && `(${t.sold_at})`}
                  </span>
                ) : (
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Sin vender</span>
                )}
                {ticketPrice > 0 && !t.is_sold && (
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>· ${ticketPrice.toLocaleString()}</span>
                )}
              </div>
              {!t.is_sold && !readOnly && (
                <button
                  onClick={() => handleMarkSold(t)}
                  className="btn-outline"
                  style={{ padding: '3px 8px', fontSize: '0.65rem', color: 'var(--color-primary)' }}
                >
                  Vender
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
