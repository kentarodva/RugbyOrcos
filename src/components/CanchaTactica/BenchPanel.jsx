import React from 'react';
import { SUPLENTES } from './constants';

function BenchPanel({ lineup, teamPlayers, onSlotClick }) {
  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'Outfit', marginBottom: '15px' }}>Banquillo de Suplentes (Banca)</h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {SUPLENTES.map(sup => {
          const assignedPlayerId = lineup[sup.id];
          const player = teamPlayers.find(p => p.id === assignedPlayerId);

          return (
            <div
              key={sup.id}
              onClick={() => onSlotClick(sup.id, sup.name)}
              style={{
                background: player ? 'rgba(0, 230, 118, 0.03)' : 'var(--bg-dark)',
                border: player ? '1px solid var(--color-primary)' : '1px solid var(--border-glass)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.8rem',
                transition: 'var(--transition-smooth)'
              }}
            >
              <div style={{ overflow: 'hidden', marginRight: '5px' }}>
                <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>#{sup.id} </span>
                <strong style={{ color: player ? '#fff' : 'var(--color-text-muted)' }}>
                  {player ? (player.apodo || player.name.split(' ').slice(0, 2).join(' ')) : sup.name}
                </strong>
              </div>
              <span style={{ fontSize: '0.7rem', color: player ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                {player ? '➔' : '+'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BenchPanel;
