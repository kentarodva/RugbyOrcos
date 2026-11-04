import React, { useState, useEffect } from 'react';
import {
  Wallet, Ticket, Utensils, Shirt, Bookmark, History,
  Plus, Minus, Package, Trophy, Clock
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useToast } from '../context/ToastContext';
import { parseLocalDate } from '../utils/dates';
import { MENSUALIDAD_BASE } from './Finanzas/constants';

const DELIVERY_STATUS_META = {
  pending: { label: 'Por pedir', chip: 'pro-chip-muted' },
  ordered: { label: 'En confección', chip: 'pro-chip-info' },
  delivered: { label: 'Entregado', chip: 'pro-chip-success' },
};

function PlayerFinanzasTab({ player, allPayments, campaigns, onOpenTickets, onOpenPaymentHistory }) {
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
    .filter(p => p.player_id === player.id)
    .sort((a, b) => new Date(b.payment_date || b.date) - new Date(a.payment_date || a.date));

  const m = player.memberships || { paid: 0, due: MENSUALIDAD_BASE };
  const paidAmt = m.paid || 0;
  const dueAmt = m.due || 0;
  const debtAmt = Math.max(0, dueAmt - paidAmt);

  let statusColor = '#ff3d00';
  let statusText = 'Moroso';
  if (paidAmt >= dueAmt) {
    statusColor = '#00e676';
    statusText = 'Al día';
  } else if (paidAmt > 0 && paidAmt < dueAmt - 2000) {
    statusColor = 'var(--color-gold)';
    statusText = 'Pago parcial';
  } else if (paidAmt > 0) {
    statusColor = 'var(--color-blue)';
    statusText = 'Casi al día';
  }

  return (
    <>
      <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
        <div className="pro-section-header" style={{ marginBottom: '14px' }}>
          <div className="pro-section-title" style={{ fontSize: '1rem' }}>
            <Wallet size={18} color="var(--color-gold)" />
            <span>Balance General de Membresía</span>
          </div>
          <span className="pro-chip pro-chip-muted tabular-nums">Cuota: ${MENSUALIDAD_BASE.toLocaleString()} COP</span>
        </div>

        <div className="pro-kpi-grid" style={{ marginBottom: '16px' }}>
          <div className="pro-kpi-card">
            <div className="pro-kpi-label">Abonado</div>
            <div className="pro-kpi-value" style={{ color: '#00e676' }}>${paidAmt.toLocaleString()}</div>
          </div>
          <div className="pro-kpi-card">
            <div className="pro-kpi-label">Saldo Pendiente</div>
            <div className="pro-kpi-value" style={{ color: debtAmt > 0 ? '#ff3d00' : '#00e676' }}>${debtAmt.toLocaleString()}</div>
          </div>
          <div className="pro-kpi-card">
            <div className="pro-kpi-label">Estado</div>
            <div className="pro-kpi-value" style={{ color: statusColor, fontSize: '1.1rem' }}>{statusText}</div>
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${dueAmt > 0 ? Math.min(100, (paidAmt / dueAmt) * 100) : 100}%`,
                background: paidAmt >= dueAmt ? '#00e676' : 'var(--color-gold)',
                borderRadius: '5px',
                transition: 'width 0.3s ease'
              }} />
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }} className="tabular-nums">
              ${paidAmt.toLocaleString()} / ${dueAmt > 0 ? dueAmt.toLocaleString() : 'Completo'} COP
            </span>
          </div>
        </div>

        {player.memberships?.lastPayment && (
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: '14px', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }} className="tabular-nums">
            Último abono: <strong>${(player.memberships.lastAmount || 0).toLocaleString()}</strong> el {player.memberships.lastPayment}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => onOpenTickets?.()} className="btn-neon" style={{ padding: '8px 16px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Ticket size={15} /> Mis Tickets de Rifa
          </button>
          <button onClick={() => onOpenPaymentHistory?.()} className="btn-outline" style={{ padding: '8px 16px', fontSize: '0.78rem', borderColor: 'var(--color-blue)', color: 'var(--color-blue)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <History size={15} /> Historial completo
          </button>
        </div>
      </div>

      {assignments.length > 0 && (
        <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
          <div className="pro-section-header" style={{ marginBottom: '14px' }}>
            <div className="pro-section-title" style={{ fontSize: '1rem' }}>
              <Ticket size={18} color="var(--color-blue)" />
              <span>Mis Campañas, Actividades y Uniformes</span>
            </div>
            <span className="pro-chip pro-chip-info tabular-nums">{assignments.length} activas</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {assignments.map(a => {
              const c = a.campaign || {};
              const isUniform = c.subtype === 'uniform';
              const isFood = c.type === 'food';
              const isRaffle = c.type === 'raffle';
              const Icon = isUniform ? Shirt : isFood ? Utensils : isRaffle ? Ticket : Bookmark;
              const pct = a.amount_due > 0 ? Math.min(100, (a.amount_paid / a.amount_due) * 100) : 0;
              const isExpired = c.deadline ? parseLocalDate(c.deadline) < new Date(new Date().toDateString()) : false;
              const statusChip = c.status === 'closed' ? 'pro-chip-info' : isExpired ? 'pro-chip-danger' : 'pro-chip-success';
              const statusLabel = c.status === 'closed' ? 'Completada' : isExpired ? 'Vencida' : 'Activa';
              const prizes = Array.isArray(c.prizes) ? c.prizes : [];
              const assignedUnits = Number(a.units_assigned || c.units_per_player || 1);
              const soldUnits = Number(a.units_sold || 0);
              const deliveryMeta = DELIVERY_STATUS_META[a.delivery_status || 'pending'] || DELIVERY_STATUS_META.pending;

              return (
                <div key={a.id} style={{ padding: '14px', background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Icon size={16} color={isUniform ? '#40c4ff' : isFood ? 'var(--color-primary)' : 'var(--color-gold)'} />
                      <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-text-main)' }}>{c.name || 'Campaña'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                      {isRaffle && a.ticket_start && a.ticket_end && (
                        <span className="pro-chip pro-chip-warning tabular-nums">Boletas #{a.ticket_start}–{a.ticket_end}</span>
                      )}
                      {isUniform && (
                        <span className={`pro-chip ${deliveryMeta.chip}`}>
                          <Package size={11} /> {deliveryMeta.label}
                        </span>
                      )}
                      <span className={`pro-chip ${statusChip}`}>{statusLabel}</span>
                    </div>
                  </div>

                  {isUniform && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      <span>Tallas registradas:</span>
                      <span className="pro-chip pro-chip-info">Camiseta: {(player.clothingSizes || player.clothing)?.jersey || 'Pendiente'}</span>
                      <span className="pro-chip pro-chip-muted">Pantaloneta: {(player.clothingSizes || player.clothing)?.shorts || 'Pendiente'}</span>
                      <span className="pro-chip pro-chip-muted">Medias: {(player.clothingSizes || player.clothing)?.socks || 'Pendiente'}</span>
                    </div>
                  )}

                  {isFood && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'rgba(0, 230, 118, 0.05)', border: '1px solid rgba(0, 230, 118, 0.15)' }}>
                      <div style={{ fontSize: '0.76rem' }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>Unidades vendidas: </span>
                        <strong className="tabular-nums" style={{ color: 'var(--color-primary)' }}>{soldUnits} de {assignedUnits}</strong>
                        {c.unit_price && (
                          <span style={{ color: 'var(--color-text-muted)', marginLeft: '6px' }} className="tabular-nums">
                            (${Number(c.unit_price).toLocaleString()} c/u)
                          </span>
                        )}
                      </div>
                      {c.status !== 'closed' && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            disabled={updatingId === a.id || soldUnits <= 0}
                            onClick={() => handleUpdateUnitsSold(a, -1)}
                            className="btn-outline"
                            style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                          >
                            <Minus size={12} />
                          </button>
                          <span className="tabular-nums" style={{ fontSize: '0.78rem', fontWeight: 800, minWidth: '24px', textAlign: 'center' }}>{soldUnits}</span>
                          <button
                            type="button"
                            disabled={updatingId === a.id}
                            onClick={() => handleUpdateUnitsSold(a, 1)}
                            className="btn-outline"
                            style={{ padding: '4px 8px', fontSize: '0.72rem', color: 'var(--color-primary)', borderColor: 'rgba(0,230,118,0.35)' }}
                          >
                            <Plus size={12} /> Reportar venta
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {prizes.length > 0 && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-gold)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Trophy size={13} /> Premios: {prizes.map(p => p.name).join(', ')}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? '#00e676' : '#ff9800', borderRadius: '4px' }} />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }} className="tabular-nums">
                      ${Number(a.amount_paid || 0).toLocaleString()} / ${Number(a.amount_due || 0).toLocaleString()}
                    </span>
                  </div>

                  {c.deadline && !isExpired && c.status !== 'closed' && (
                    <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }} className="tabular-nums">
                      <Clock size={12} /> {Math.ceil((parseLocalDate(c.deadline) - new Date()) / (1000 * 60 * 60 * 24))} días restantes (vence {c.deadline})
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {myPayments.length > 0 && (
        <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
          <div className="pro-section-header" style={{ marginBottom: '12px' }}>
            <div className="pro-section-title" style={{ fontSize: '1rem' }}>
              <History size={18} color="#00e676" />
              <span>Historial de Pagos</span>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['membership', 'fundraising'].map(src => {
                const count = myPayments.filter(p => p.source === src).length;
                if (!count) return null;
                return (
                  <span key={src} className={`pro-chip ${src === 'membership' ? 'pro-chip-success' : 'pro-chip-warning'} tabular-nums`}>
                    {src === 'membership' ? 'Membresía' : 'Campaña'} × {count}
                  </span>
                );
              })}
            </div>
          </div>
          <div className="pro-table-wrap">
            <table className="pro-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Origen</th>
                  <th>Detalle</th>
                  <th className="num">Monto</th>
                </tr>
              </thead>
              <tbody>
                {myPayments.map((p, i) => (
                  <tr key={i}>
                    <td className="tabular-nums" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {p.payment_date || p.date || '—'}
                    </td>
                    <td>
                      <span className={`pro-chip ${p.source === 'fundraising' ? 'pro-chip-warning' : 'pro-chip-success'}`}>
                        {p.source === 'fundraising' ? 'Campaña' : 'Membresía'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                      {p.notes || 'Abono registrado'}
                    </td>
                    <td className="num" style={{ color: '#00e676', fontWeight: 700 }}>
                      +${Number(p.amount || p.monto || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

export default PlayerFinanzasTab;
