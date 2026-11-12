import React from 'react';
import { TOURNAMENT_STATUS_MAP } from './constants';

export function TournamentCard({ tournament, teamName, onSelect, onEdit }) {
  const statusInfo = TOURNAMENT_STATUS_MAP[tournament.status] || TOURNAMENT_STATUS_MAP.proximo;
  const borderColor = statusInfo.color;

  return (
    <div className="glass-panel" onClick={() => onSelect(tournament)}
      style={{ padding: '15px 20px', marginBottom: '10px', cursor: 'pointer', borderRadius: 'var(--radius-md)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderLeft: '3px solid ' + borderColor, position: 'relative' }}>
      <div>
        <h4 style={{ color: 'var(--color-text)', fontSize: '0.95rem', fontWeight: 700 }}>{tournament.name}</h4>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>{tournament.start_date} → {tournament.end_date}</p>
      </div>
      <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{
          padding: '4px 12px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 700,
          background: tournament.status === 'finalizado' ? 'rgba(46, 229, 122,0.1)' : tournament.status === 'en_curso' ? 'rgba(232, 185, 49,0.1)' : tournament.status === 'cancelado' ? 'rgba(255, 92, 77,0.1)' : 'rgba(255,255,255,0.05)',
          color: statusInfo.color
        }}>
          {statusInfo.label}
        </span>
        {tournament.winner_team_id && <p style={{ fontSize: '0.7rem', color: '#E8B931', margin: 0 }}>Campeon: {teamName(tournament.winner_team_id)}</p>}
        {onEdit && (
          <button onClick={(e) => { e.stopPropagation(); onEdit(tournament); }}
            style={{ background: 'none', border: '1px solid var(--border-glass)', borderRadius: '4px', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '4px 8px', fontSize: '0.7rem' }}>
            ✎
          </button>
        )}
      </div>
    </div>
  );
}
