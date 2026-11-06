import React from 'react';
import { LOAN_STATUS_COLORS, LOAN_STATUS_LABELS } from './constants';

export function LoanCard({ loan, teams, onApprove, onReject, onReturn, onCancel, canRespond = false, canReturn = false, canCancel = false }) {
  const p = loan.players;
  const statusColor = LOAN_STATUS_COLORS[loan.status] || '#9e9e9e';
  const statusLabel = LOAN_STATUS_LABELS[loan.status] || loan.status;
  const fromTeam = teams.find(t => t.id === loan.from_team_id);
  const toTeam = teams.find(t => t.id === loan.to_team_id);
  const fromName = fromTeam?.rpg_name || fromTeam?.name || '—';
  const toName = toTeam?.rpg_name || toTeam?.name || '—';
  const fromIsExternal = fromTeam?.is_external;
  const toIsExternal = toTeam?.is_external;

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
          {fromName}{fromIsExternal ? <span style={{ fontSize: '0.55rem', color: '#E8B931', marginLeft: '3px' }}>ⓘ</span> : ''} → {toName}{toIsExternal ? <span style={{ fontSize: '0.55rem', color: '#E8B931', marginLeft: '3px' }}>ⓘ</span> : ''}
          {' • '}{loan.start_date} → {loan.end_date}
          {loan.reason && <span> • {loan.reason}</span>}
        </div>
      </div>
      {loan.status === 'pending' && (canRespond || canCancel) && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {canRespond && <button onClick={() => onApprove(loan.id)}
            className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.7rem', borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
            ✓ Aprobar
          </button>}
          {canRespond && <button onClick={() => onReject(loan.id)}
            className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.7rem', borderColor: 'var(--color-red)', color: 'var(--color-red)' }}>
            ✗ Rechazar
          </button>}
          {canCancel && !canRespond && onCancel && (
            <button onClick={() => onCancel(loan.id)} className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.7rem' }}>
              Cancelar solicitud
            </button>
          )}
        </div>
      )}
      {loan.status === 'approved' && canReturn && (
        <button onClick={() => onReturn(loan.id)}
          className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.7rem' }}>
          ↩ Devolver
        </button>
      )}
    </div>
  );
}
