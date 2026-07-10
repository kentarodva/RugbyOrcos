import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { parseLocalDate } from '../utils/dates';
import { MENSUALIDAD_BASE } from './Finanzas/constants';

function PlayerFinanzasTab({ player, allPayments, campaigns, onOpenTickets, onOpenPaymentHistory }) {
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    if (!player?.id || !campaigns?.length) return;
    supabase.from('fundraising_assignments')
      .select('*, campaign:campaign_id(name, type, status, deadline, ticket_price)')
      .eq('player_id', player.id)
      .then(({ data }) => {
        if (data) setAssignments(data);
      });
  }, [player?.id, campaigns?.length]);

  const myPayments = (allPayments || [])
    .filter(p => p.player_id === player.id)
    .sort((a, b) => new Date(b.payment_date || b.date) - new Date(a.payment_date || a.date));

  return (
    <>
      <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
        <h3 style={{ color: 'var(--color-gold)', fontSize: '1rem', fontWeight: 700, marginBottom: '12px', fontFamily: 'Outfit' }}>
          Balance General
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
          <div style={{ textAlign: 'center', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.55rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Pagado</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#00e676' }}>${(player.memberships?.paid || 0).toLocaleString()}</div>
          </div>
          <div style={{ textAlign: 'center', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.55rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Debe</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ff3d00' }}>${((player.memberships?.due || 0) - (player.memberships?.paid || 0)).toLocaleString()}</div>
          </div>
          <div style={{ textAlign: 'center', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.55rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Estado</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: (() => {
              const m = player.memberships || { paid: 0, due: MENSUALIDAD_BASE };
              if (m.paid >= m.due) return '#00e676';
              if (m.paid > 0 && m.paid < m.due - 2000) return 'var(--color-gold)';
              if (m.paid > 0) return 'var(--color-blue)';
              return '#ff3d00';
            })() }}>
              {(() => {
                const m = player.memberships || { paid: 0, due: MENSUALIDAD_BASE };
                if (m.paid >= m.due) return 'Al día';
                if (m.paid > 0 && m.paid < m.due - 2000) return 'Pago parcial';
                if (m.paid > 0) return 'Casi al día';
                return 'Moroso';
              })()}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
            Membresía mensual: ${MENSUALIDAD_BASE.toLocaleString()} COP
          </p>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ flex: 1, height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${player.memberships?.due > 0 ? Math.min(100, ((player.memberships?.paid || 0) / player.memberships.due) * 100) : 100}%`,
                background: (player.memberships?.paid || 0) >= (player.memberships?.due || 0) ? '#00e676' : 'var(--color-gold)', borderRadius: '5px' }} />
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
              ${(player.memberships?.paid || 0).toLocaleString()} / ${player.memberships?.due > 0 ? player.memberships.due.toLocaleString() : 'Completo'} COP
            </span>
          </div>
        </div>

        {player.memberships?.lastPayment && (
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '12px', padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
            Último abono: <strong>${(player.memberships.lastAmount || 0).toLocaleString()}</strong> el {player.memberships.lastPayment}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => onOpenTickets?.()} className="btn-neon" style={{ padding: '8px 16px', fontSize: '0.78rem' }}>
            🎟️ Mis Tickets
          </button>
          <button onClick={() => onOpenPaymentHistory?.()} className="btn-outline" style={{ padding: '8px 16px', fontSize: '0.78rem', borderColor: 'var(--color-blue)', color: 'var(--color-blue)' }}>
            📋 Historial completo
          </button>
        </div>
      </div>

      {assignments.length > 0 && (
        <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
          <h3 style={{ color: 'var(--color-blue)', fontSize: '1rem', fontWeight: 700, marginBottom: '12px', fontFamily: 'Outfit' }}>
            Mis Campañas
          </h3>
          {assignments.map(a => {
            const c = a.campaign || {};
            const pct = a.amount_due > 0 ? Math.min(100, (a.amount_paid / a.amount_due) * 100) : 0;
            const isExpired = c.deadline ? parseLocalDate(c.deadline) < new Date(new Date().toDateString()) : false;
            const statusColor = c.status === 'closed' ? 'var(--color-blue)' : isExpired ? '#ff3d00' : '#00e676';
            const statusLabel = c.status === 'closed' ? 'Completada' : isExpired ? 'Vencida' : 'Activa';
            const prizes = c.prizes || [];
            return (
              <div key={a.id} style={{ marginBottom: '12px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--color-text)' }}>{c.name || 'Campaña'}</span>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <span className="badge" style={{ fontSize: '0.55rem', padding: '1px 6px', background: `${statusColor}15`, border: `1px solid ${statusColor}40`, color: statusColor }}>
                      {statusLabel}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
                      {c.type === 'raffle' ? '🎟️' : c.type === 'food' ? '🍔' : '📦'} {a.ticket_start && a.ticket_end ? `#${a.ticket_start}-${a.ticket_end}` : ''}
                    </span>
                  </div>
                </div>
                {prizes.length > 0 && (
                  <div style={{ fontSize: '0.62rem', color: 'var(--color-gold)', marginBottom: '6px' }}>
                    🏆 Premios: {prizes.map(p => p.name).join(', ')}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? '#00e676' : '#ff9800', borderRadius: '4px' }} />
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                    ${a.amount_paid.toLocaleString()} / ${a.amount_due.toLocaleString()}
                  </span>
                </div>
                {c.deadline && !isExpired && c.status !== 'closed' && (
                  <div style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    ⏳ {Math.ceil((parseLocalDate(c.deadline) - new Date()) / (1000 * 60 * 60 * 24))} días restantes
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {myPayments.length > 0 && (
        <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
          <h3 style={{ color: '#00e676', fontSize: '1rem', fontWeight: 700, marginBottom: '12px', fontFamily: 'Outfit' }}>
            Historial de Pagos
          </h3>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            {['membership', 'fundraising'].map(src => {
              const count = myPayments.filter(p => p.source === src).length;
              if (!count) return null;
              return (
                <span key={src} style={{ fontSize: '0.65rem', padding: '4px 10px', borderRadius: '20px', background: src === 'membership' ? 'rgba(0,230,118,0.1)' : 'rgba(255,152,0,0.1)', color: src === 'membership' ? '#00e676' : '#ff9800' }}>
                  {src === 'membership' ? '💰 Membresía' : '🎟️ Recaudación'} × {count}
                </span>
              );
            })}
          </div>
          {myPayments.map((p, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem' }}>
              <span style={{ color: 'var(--color-text)' }}>
                {p.source === 'fundraising' ? '🎟️' : '💰'} {p.payment_date || p.date || '—'}
                {p.notes ? <span style={{ color: 'var(--color-text-muted)', marginLeft: '6px', fontSize: '0.65rem' }}>— {p.notes}</span> : ''}
              </span>
              <span style={{ color: '#00e676', fontWeight: 700 }}>${Number(p.amount || p.monto || 0).toLocaleString()}</span>
            </div>
          ))}
      </div>
    )}
    </>
  );
}

export default PlayerFinanzasTab;
