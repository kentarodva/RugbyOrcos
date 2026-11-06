import React, { useState, useEffect, useContext } from 'react';
import { ClubContext } from '../../context/ClubContext';
import { useToast } from '../../context/ToastContext';
import { CopInput } from '../common/FormattedInputs';

export function SellTicketsModal({ campaign, assignment, tickets, onClose, readOnly }) {
  const { sellTickets, addFinanceRecord } = useContext(ClubContext);
  const { showToast } = useToast();
  const ticketPrice = Number(campaign.ticket_price) || 0;

  const unsoldTickets = tickets.filter(t => !t.is_sold);
  const totalUnsold = unsoldTickets.length;
  const alreadyPaid = Number(assignment.amount_paid);
  const amountDue = Number(assignment.amount_due);

  const [quantity, setQuantity] = useState('');
  const [amount, setAmount] = useState('');
  const [soldToName, setSoldToName] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastEdited, setLastEdited] = useState('');

  useEffect(() => {
    if (lastEdited === 'quantity' && quantity) {
      const q = Math.min(Number(quantity), totalUnsold);
      if (q > 0 && ticketPrice > 0) {
        setAmount(String(q * ticketPrice));
      }
    }
  }, [quantity, lastEdited, ticketPrice, totalUnsold]);

  useEffect(() => {
    if (lastEdited === 'amount' && amount) {
      const a = Number(amount);
      if (a > 0 && ticketPrice > 0) {
        const q = Math.floor(a / ticketPrice);
        if (q > 0) setQuantity(String(q));
        else setQuantity('');
      }
    }
  }, [amount, lastEdited, ticketPrice]);

  const calcQuantity = Number(quantity) || 0;
  const calcAmount = Number(amount) || 0;
  const ticketsToSell = Math.min(calcQuantity, totalUnsold);
  const effectiveAmount = calcQuantity > 0
    ? ticketsToSell * ticketPrice
    : calcAmount;
  const remainder = calcAmount - (ticketsToSell * ticketPrice);
  const _newTotalPaid = alreadyPaid + effectiveAmount + Math.max(0, remainder);

  const canConfirm = (calcQuantity > 0 || calcAmount > 0) && effectiveAmount > 0;

  const handleConfirm = async () => {
    if (!canConfirm || saving) return;
    setSaving(true);
    try {
      const finalQuantity = Math.min(
        calcQuantity > 0 ? calcQuantity : Math.floor(calcAmount / ticketPrice),
        totalUnsold
      );
      const finalAmount = calcQuantity > 0
        ? finalQuantity * ticketPrice + Math.max(0, remainder)
        : calcAmount;

      await sellTickets({
        campaign,
        assignment,
        unsoldTickets,
        quantity: finalQuantity,
        amount: finalAmount,
        soldToName: soldToName.trim(),
      });

      if (finalAmount > 0) {
        addFinanceRecord({
          desc: `🎟️ ${campaign.name} - ${finalQuantity > 0 ? `${finalQuantity} boletas` : 'Abono'}${soldToName.trim() ? ` (${soldToName.trim()})` : ''}`,
          amount: finalAmount,
          type: 'ingreso',
          category: 'general',
          date: new Date().toISOString().split('T')[0],
        });
      }

      const msg = finalQuantity > 0
        ? `${finalQuantity} boleta(s) vendida(s) por $${finalAmount.toLocaleString()}.${remainder > 0 ? ` Abono de $${remainder.toLocaleString()} registrado.` : ''}`
        : `Abono de $${finalAmount.toLocaleString()} registrado.`;
      showToast(msg, 'success');
      onClose();
    } catch (err) {
      showToast('Error al registrar venta. Intenta de nuevo.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animated-slide" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>🎟️ Vender Boletas</h3>
          <button onClick={onClose} className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>✕</button>
        </div>

        <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)', fontSize: '0.85rem' }}>
          <strong>{campaign.name}</strong>
          <div style={{ marginTop: '4px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
            ${ticketPrice.toLocaleString()} c/u · Boletas {assignment.ticket_start}–{assignment.ticket_end}
          </div>
          <div style={{ marginTop: '6px', display: 'flex', gap: '15px', fontSize: '0.75rem' }}>
            <span>Sin vender: <strong style={{ color: 'var(--color-gold)' }}>{totalUnsold}</strong></span>
            <span>Ya pagado: <strong style={{ color: 'var(--color-primary)' }}>${alreadyPaid.toLocaleString()}</strong></span>
            <span>Debe: <strong style={{ color: 'var(--color-red)' }}>${amountDue.toLocaleString()}</strong></span>
          </div>
        </div>

        {readOnly ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '15px' }}>
            Solo puedes ver la información. Contacta al tesorero para gestionar ventas.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '10px', marginBottom: '15px' }}>
            <div className="form-group">
              <label>Cantidad de boletas</label>
              <input
                type="number"
                value={quantity}
                onChange={e => { setQuantity(e.target.value); setLastEdited('quantity'); }}
                placeholder="0"
                min="0"
                max={totalUnsold}
                className="form-input"
                style={{ padding: '8px', fontSize: '0.85rem' }}
              />
              {quantity && totalUnsold > 0 && calcQuantity > totalUnsold && (
                <span style={{ fontSize: '0.65rem', color: 'var(--color-red)' }}>Solo hay {totalUnsold} sin vender</span>
              )}
            </div>
            <div className="form-group">
              <label>Monto total ($ COP)</label>
              <CopInput
                value={amount}
                onChange={e => { setAmount(e.target.value); setLastEdited('amount'); }}
                placeholder="0"
                style={{ padding: '8px', fontSize: '0.85rem' }}
              />
            </div>
          </div>
        )}

        {calcQuantity > 0 && ticketPrice > 0 && (
          <div style={{ padding: '10px', background: 'rgba(46, 229, 122, 0.04)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(46, 229, 122, 0.15)', marginBottom: '12px', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{ticketsToSell} × ${ticketPrice.toLocaleString()}</span>
              <strong>${(ticketsToSell * ticketPrice).toLocaleString()}</strong>
            </div>
            {remainder > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', color: 'var(--color-gold)' }}>
                <span>Abono (sobrante)</span>
                <strong>+${remainder.toLocaleString()}</strong>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', borderTop: '1px solid rgba(46, 229, 122, 0.15)', paddingTop: '6px', fontWeight: 800 }}>
              <span>Total</span>
              <span style={{ color: 'var(--color-primary)' }}>${(effectiveAmount + Math.max(0, remainder)).toLocaleString()}</span>
            </div>
          </div>
        )}

        {calcAmount > 0 && !calcQuantity && (
          <div style={{ padding: '10px', background: 'rgba(46, 229, 122, 0.04)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(46, 229, 122, 0.15)', marginBottom: '12px', fontSize: '0.85rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
              ${calcAmount.toLocaleString()} = {Math.floor(calcAmount / ticketPrice)} boletas × ${ticketPrice.toLocaleString()}
              {calcAmount % ticketPrice > 0 && (
                <span style={{ color: 'var(--color-gold)' }}> + ${(calcAmount % ticketPrice).toLocaleString()} abono</span>
              )}
            </div>
          </div>
        )}

        {!readOnly && (
          <div className="form-group" style={{ marginBottom: '15px' }}>
            <label>Nombre del comprador (opcional)</label>
            <input
              type="text"
              value={soldToName}
              onChange={e => setSoldToName(e.target.value)}
              placeholder="Ej. María García"
              className="form-input"
              style={{ padding: '8px', fontSize: '0.85rem' }}
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-outline">Cerrar</button>
          {!readOnly && (
            <button
              onClick={handleConfirm}
              className="btn-neon"
              disabled={!canConfirm || saving}
              style={{ opacity: !canConfirm || saving ? 0.5 : 1 }}
            >
              {saving ? '💾 Guardando...' : '✅ Confirmar Venta'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
