import React, { useState, useEffect, useContext } from 'react';
import {
  Wallet, Ticket, History, Plus, Minus, CheckCircle2, AlertCircle
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useToast } from '../context/ToastContext';
import { ClubContext } from '../context/ClubContext.jsx';
import { membershipStatus } from '../utils/membership';

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
  const { mensualidadBase = 10000 } = useContext(ClubContext) || {};
  const MENSUALIDAD_BASE = mensualidadBase;
  // Debido y pagado los mantiene la BD (migración 92): una sola regla en toda la app.
  const status = membershipStatus(player, mensualidadBase);
  const paidAmt = status.paid;
  const owedAmt = status.owed;
  const isCovered = owedAmt <= 0;
  const lastPayment = membershipPayments[0];

  const now = new Date();
  const currentMonthName = now.toLocaleString('es-CO', { month: 'long', year: 'numeric' });
  const lastPayDateStr = lastPayment?.payment_date || player?.memberships?.lastPayment || null;
  const lastPayAmount = Number(lastPayment?.amount || player?.memberships?.lastAmount || 0);
  const lastPayDate = lastPayDateStr ? new Date(String(lastPayDateStr).slice(0, 10) + 'T00:00:00') : null;
  const lastPayMonthName = lastPayDate
    ? lastPayDate.toLocaleString('es-CO', { month: 'long', year: 'numeric' })
    : null;
  // "Pendiente" = la BD dice que debe algo (cobros mensuales sin pagar), no la fecha del último pago.
  const isPastCycle = !isCovered;

  const whatsappPaymentMsg = encodeURIComponent(
    `🏉 *RUGBY ORCOS — Comprobante de Membresía*\n` +
    `¡Hola Tesorería! Adjunto el soporte de pago de mi cuota mensual correspondiente a *${currentMonthName}* ($${(owedAmt || mensualidadBase).toLocaleString()} COP).\n` +
    `👤 *Guerrero:* ${player.name}\n` +
    `🏉 *Posición:* ${player.posicion || 'Pilar'} #${player.jerseyNumber || 1}\n` +
    `¡Por la Horda! 💚⚔️`
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* General Membership Balance Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(22, 25, 23, 0.95) 0%, rgba(12, 15, 13, 0.98) 100%)',
          border: `1px solid ${isPastCycle ? 'rgba(255, 215, 64, 0.4)' : isCovered ? 'rgba(46, 229, 122, 0.35)' : 'rgba(255, 92, 77, 0.35)'}`,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Wallet size={24} color={isPastCycle ? 'var(--color-gold)' : isCovered ? 'var(--color-primary)' : '#FF5C4D'} />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>
                Membresía Mensual & Cuotas Oficiales
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Ciclo activo del club: <strong style={{ color: 'var(--color-gold)', textTransform: 'capitalize' }}>{currentMonthName}</strong> &middot; Cuota base: <strong>${MENSUALIDAD_BASE.toLocaleString()} COP/mes</strong>
              </p>
            </div>
          </div>

          <span
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '0.74rem',
              fontWeight: 800,
              background: isPastCycle ? 'rgba(255, 215, 64, 0.12)' : isCovered ? 'rgba(46, 229, 122, 0.12)' : 'rgba(255, 92, 77, 0.12)',
              color: isPastCycle ? 'var(--color-gold)' : isCovered ? 'var(--color-primary)' : 'var(--color-red)',
              border: `1px solid ${isPastCycle ? 'var(--color-gold)' : isCovered ? 'var(--color-primary)' : 'var(--color-red)'}`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {isPastCycle ? <AlertCircle size={14} /> : isCovered ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            {isCovered ? 'CUOTA AL DÍA' : status.monthsOwed > 1 ? `DEBE ${status.monthsOwed} CUOTAS` : status.label}
          </span>
        </div>

        {/* 3 Main KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '12px', marginBottom: '16px' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(46, 229, 122, 0.25)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Abono Registrado</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#2EE57A', fontFamily: 'var(--font-display)' }}>${paidAmt.toLocaleString()}</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--color-primary)', marginTop: '2px' }}>{lastPayMonthName ? `Último abono: ${lastPayMonthName}` : 'Sin abonos todavía'}</div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: `1px solid ${isPastCycle ? 'rgba(255, 215, 64, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`, borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Saldo Pendiente</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: isPastCycle ? 'var(--color-gold)' : '#2EE57A', fontFamily: 'var(--font-display)' }}>
              ${owedAmt.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginTop: '2px', textTransform: 'capitalize' }}>
              {isCovered ? (status.credit > 0 ? `Saldo a favor $${status.credit.toLocaleString()}` : 'Sin deuda') : `${status.monthsOwed} cuota(s) de $${MENSUALIDAD_BASE.toLocaleString()}`}
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 215, 64, 0.25)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Último Comprobante</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--color-gold)', fontFamily: 'var(--font-display)', marginTop: '6px' }}>
              {lastPayDateStr ? String(lastPayDateStr).slice(0, 10) : '—'}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              {lastPayAmount ? `$${lastPayAmount.toLocaleString()} COP recibido` : 'Sin comprobantes'}
            </div>
          </div>
        </div>

        {/* Clear Explanation of Monthly Cycle and Payment Options */}
        <div style={{ background: 'rgba(255, 215, 64, 0.06)', border: '1px solid rgba(255, 215, 64, 0.25)', borderRadius: '12px', padding: '14px 18px', fontSize: '0.8rem', color: '#e2e8f0', lineHeight: 1.6 }}>
          <p style={{ margin: '0 0 8px 0' }}>
            💡 <strong>Cuota del club:</strong> <strong>${MENSUALIDAD_BASE.toLocaleString()} COP</strong> al mes. Tesorería registra el cobro de cada mes y tus abonos lo descuentan.{' '}
            {isCovered
              ? <>Estás al día{lastPayMonthName ? <> (último abono en <strong>{lastPayMonthName}</strong>)</> : null}.</>
              : <>Tienes <strong style={{ color: 'var(--color-gold)' }}>${owedAmt.toLocaleString()} COP</strong> pendientes; puedes transferir directamente a tesorería.</>}
          </p>

          <div style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <a
              href={`https://wa.me/?text=${whatsappPaymentMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{ padding: '8px 18px', fontSize: '0.78rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
            >
              📲 Notificar Abono de {currentMonthName} por WhatsApp
            </a>

            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
              Nequi / Bancolombia del Club &middot; Soporte verificado por el Tesorero
            </span>
          </div>
        </div>
      </div>

      {/* Verified Transactions History (Ledger) */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={18} color="var(--color-gold)" />
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#fff' }}>
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
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#2EE57A', fontFamily: 'var(--font-display)' }}>
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
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#fff' }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '12px' }}>
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
                    <span style={{ color: '#2EE57A', fontWeight: 800 }}>${collected.toLocaleString()} COP</span>
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
