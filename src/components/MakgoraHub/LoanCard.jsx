import React from 'react';
import { LOAN_STATUS_COLORS, LOAN_STATUS_LABELS } from './constants';

export function LoanCard({ loan, teams, onApprove, onReject, onReturn }) {
  const p = loan.players;
  const statusColor = LOAN_STATUS_COLORS[loan.status] || '#9e9e9e';
  const statusLabel = LOAN_STATUS_LABELS[loan.status] || loan.status;
  const fromName = teams.find(t => t.id === loan.from_team_id)?.rpg_name || '�';
  const toName = teams.find(t => t.id === loan.to_team_id)?.rpg_name || '�';

  return (
    <div className="glass-panel" style={{
      padding: '14px 18px', borderRadius: 'var(--radius-md)',
      borderLeft: '3px solid ' + statusColor,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px'
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-text)' }}>
            {p?.first_name} {p?.last_name}
          </span>
          <span style={{
            padding: '2px 8px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 700,
            background: statusColor + '22', color: statusColor
          }}>
            {statusLabel}
          </span>
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
          {fromName} ? {toName}
          {' � '}{loan.start_date} ? {loan.end_date}
          {loan.reason && <span> � {loan.reason}</span>}
        </div>
      </div>
      {loan.status === 'pending' && (
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => onApprove(loan.id)}
            className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.7rem', borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
            ? Aprobar
          </button>
          <button onClick={() => onReject(loan.id)}
            className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.7rem', borderColor: 'var(--color-red)', color: 'var(--color-red)' }}>
            ? Rechazar
          </button>
        </div>
      )}
      {loan.status === 'approved' && (
        <button onClick={() => onReturn(loan.id)}
          className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.7rem' }}>
          ?? Devolver
        </button>
      )}
    </div>
  );
}
