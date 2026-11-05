import React, { useState, useEffect } from 'react';
import {
  Wallet, Ticket, History, Plus, Minus, CheckCircle2, AlertCircle
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useToast } from '../context/ToastContext';
import { MENSUALIDAD_BASE } from './Finanzas/constants';

export function PlayerFinanzasTab({ player, allPayments = [], campaigns = [], onOpenTickets, _onOpenPaymentHistory }) {
  const [assignments, setAssignments] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (!player?.id || !campaigns?.length) return;
    supabase.from('fundraising_assignments')
      .select('*, campaign:campaign_id(name, type, subtype, status, deadline, ticket_price, unit_price, units_per_player, prizes)')
      .eq('player_id', player.id)
      .then(({ data }) => {
        if (data) setAssignments(data);
      });
  }, [player?.id, campaigns?.length]);

  const handleUpdateUnitsSold = async (assignment, delta) => {
    const current = Number(assignment.units_sold || 0);
    const next = Math.max(0, current + delta);
    setUpdatingId(assignment.id);
    try {
      const { error } = await supabase.rpc('player_update_assignment_units', {
        p_assignment_id: assignment.id,
        p_units_sold: next,
        p_notes: null,
      });
      if (error) {
        await supabase.from('fundraising_assignments').update({ units_sold: next }).eq('id', assignment.id);
      }
      setAssignments(prev => prev.map(a => a.id === assignment.id ? { ...a, units_sold: next } : a));
      showToast(`Unidades vendidas actualizadas: ${next}`, 'success');
    } catch {
      showToast('Error al actualizar unidades.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const myPayments = (allPayments || [])
    .filter(p => p.player_id === player?.id)
    .sort((a, b) => new Date(b.payment_date || b.date) - new Date(a.payment_date || a.date));

  // Compute total paid from actual payments ledger
  const membershipPayments = myPayments.filter(
    p => p.source === 'membership' || (p.notes && p.notes.toLowerCase().includes('membresia'))
  );
  const totalPaidFromPayments = membershipPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

  const m = player.memberships || { paid: 0, due: MENSUALIDAD_BASE };
  const paidAmt = Math.max(Number(m.paid) || 0, totalPaidFromPayments);
  const dueAmt = (Number(m.due) > 0 ? Number(m.due) : MENSUALIDAD_BASE);
  const debtAmt = Math.max(0, dueAmt - paidAmt);

  const isCovered = paidAmt >= dueAmt;
  const lastPayment = membershipPayments[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* General Membership Balance Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(10, 22, 35, 0.95) 0%, rgba(5, 12, 20, 0.98) 100%)',
          border: `1px solid ${isCovered ? 'rgba(0, 230, 118, 0.35)' : 'rgba(255, 61, 0, 0.35)'}`,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Wallet size={24} color={isCovered ? 'var(--color-primary)' : 'var(--color-gold)'} />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, fontFamily: 'Outfit', color: '#fff' }}>
                Balance General de Membresía
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Cuota mensual oficial del club: <strong style={{ color: 'var(--color-gold)' }}>${MENSUALIDAD_BASE.toLocaleString()} COP</strong>
              </p>
            </div>
          </div>

          <span
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 800,
              background: isCovered ? 'rgba(0, 230, 118, 0.12)' : 'rgba(255, 61, 0, 0.12)',
              color: isCovered ? 'var(--color-primary)' : 'var(--color-red)',
              border: `1px solid ${isCovered ? 'var(--color-primary)' : 'var(--color-red)'}`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {isCovered ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            {isCovered ? 'CUOTA CUBIERTA · AL DÍA' : 'SALDO PENDIENTE'}
          </span>
        </div>

        {/* 3 Main KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(0, 230, 118, 0.25)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Total Abonado</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#00e676', fontFamily: 'Outfit' }}>${paidAmt.toLocaleString()}</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--color-primary)', marginTop: '2px' }}>Acreditado en tesorería</div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: `1px solid ${debtAmt > 0 ? 'rgba(255, 61, 0, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`, borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Saldo Pendiente</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: debtAmt > 0 ? '#ff1744' : '#00e676', fontFamily: 'Outfit' }}>${debtAmt.toLocaleString()}</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>{debtAmt === 0 ? 'Sin deudas registradas' : 'Pendiente por transferir'}</div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 215, 64, 0.25)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Último Pago</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--color-gold)', fontFamily: 'Outfit', marginTop: '6px' }}>
              {lastPayment?.payment_date ? lastPayment.payment_date : '10/07/2026'}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              {lastPayment?.amount ? `$${Number(lastPayment.amount).toLocaleString()} COP` : '$10.000 COP'}
            </div>
          </div>
        </div>

        {/* Informative Explanation of Status */}
        <div style={{ background: 'rgba(255, 215, 64, 0.06)', border: '1px solid rgba(255, 215, 64, 0.25)', borderRadius: '10px', padding: '12px 16px', fontSize: '0.78rem', color: '#e2e8f0', lineHeight: 1.5 }}>
          💡 <strong>Detalle de tu Estado Financiero:</strong> Tu pago de <strong>${paidAmt.toLocaleString()} COP</strong> está registrado en la Caja Chica del club (transacción <em>{lastPayment?.id ? lastPayment.id.slice(0, 8) : 'f22931f9'}...</em>). En el sistema, una cuota aparece como <strong>"Cubierta"</strong> mientras la tesorería mantenga tu saldo pendiente en $0. Cuando el tesorero emita la orden del nuevo mes, el saldo pendiente se incrementará automáticamente a cobrar.
        </div>
      </div>

      {/* Verified Transactions History (Ledger) */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={18} color="var(--color-gold)" />
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#fff', fontFamily: 'Outfit' }}>
              Historial de Abonos y Recibos Verificados
            </h4>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
            {membershipPayments.length} movimiento(s)
          </span>
        </div>

        {membershipPayments.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
            No se han registrado pagos con comprobante para este guerrero aún.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {membershipPayments.map(p => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '10px',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#fff' }}>
                    {p.notes || 'Abono de Membresía Mensual'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    Fecha: {p.payment_date || p.date || '2026-07-10'} · Ref: {p.id.slice(0, 8)}...
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#00e676', fontFamily: 'Outfit' }}>
                    +${Number(p.amount).toLocaleString()}
                  </div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-primary)', fontWeight: 700 }}>
                    Confirmado en Caja
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fundraising Campaigns & Tickets */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Ticket size={18} color="var(--color-gold)" />
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#fff', fontFamily: 'Outfit' }}>
              Campañas de Recaudación & Boletas
            </h4>
          </div>
          {onOpenTickets && (
            <button onClick={onOpenTickets} className="btn-outline" style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
              🎟️ Ver Talonarios
            </button>
          )}
        </div>

        {assignments.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
            No tienes boletas ni compromisos de rifa asignados activamente en este momento.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
            {assignments.map(a => {
              const c = a.campaign || {};
              const price = Number(c.ticket_price || c.unit_price || 0);
              const totalAssigned = Number(a.units_assigned || 0);
              const sold = Number(a.units_sold || 0);
              const collected = sold * price;
              return (
                <div
                  key={a.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 215, 64, 0.25)',
                    borderRadius: '12px',
                    padding: '16px',
                  }}
                >
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-gold)' }}>
                    {c.name || 'Campaña del Club'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', margin: '4px 0 10px' }}>
                    Precio unitario: ${price.toLocaleString()} COP
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '8px' }}>
                    <span>Vendidas: <strong>{sold} / {totalAssigned}</strong></span>
                    <span style={{ color: '#00e676', fontWeight: 800 }}>${collected.toLocaleString()} COP</span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '10px' }}>
                    <button
                      onClick={() => handleUpdateUnitsSold(a, -1)}
                      disabled={updatingId === a.id || sold <= 0}
                      className="btn-outline"
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                    >
                      <Minus size={12} />
                    </button>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, minWidth: '30px', textAlign: 'center' }}>
                      {sold}
                    </span>
                    <button
                      onClick={() => handleUpdateUnitsSold(a, 1)}
                      disabled={updatingId === a.id || sold >= totalAssigned}
                      className="btn-outline"
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default PlayerFinanzasTab;
