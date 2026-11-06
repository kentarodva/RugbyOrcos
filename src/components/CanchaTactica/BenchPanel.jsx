import React from 'react';
import { SUPLENTES } from './constants';

function BenchPanel({ lineup, teamPlayers, onSlotClick }) {
  return (
    <div className="glass-panel" style={{ padding: '16px' }}>
      <h3 className="section-title" style={{ marginBottom: '12px' }}>Banca</h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '10px' }}>
        {SUPLENTES.map(sup => {
          const assignedPlayerId = lineup[sup.id];
          const player = teamPlayers.find(p => p.id === assignedPlayerId);

          return (
            <button
              type="button"
              key={sup.id}
              onClick={() => onSlotClick(sup.id, sup.name)}
              style={{
                background: 'var(--bg-elevated)',
                border: player ? '1px solid var(--border-strong)' : '1px dashed var(--border-glass)',
                padding: '8px 12px',
                minHeight: '44px',
                color: 'var(--color-text)',
                textAlign: 'left',
                font: 'inherit',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.8125rem',
                transition: 'var(--transition-smooth)'
              }}
            >
              <div style={{ overflow: 'hidden', marginRight: '5px' }}>
                <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>#{sup.id} </span>
                <strong style={{ fontWeight: player ? 600 : 500, color: player ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
                  {player ? (player.apodo || player.name.split(' ').slice(0, 2).join(' ')) : sup.name}
                </strong>
              </div>
              <span style={{ fontSize: '0.7rem', color: player ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                {player ? '' : '+'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default BenchPanel;
