import React from 'react';
import { STYLE } from './constants';

export function FixtureMatch({ match, onUpdate }) {
  const homeName = match.home?.rpg_name || match.home?.name || '�';
  const awayName = match.away?.rpg_name || match.away?.name || '�';

  return (
    <div className="glass-panel" style={{
      padding: '12px 20px', marginBottom: '8px', borderRadius: 'var(--radius-sm)',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    }}>
      <div style={{ flex: 1, textAlign: 'right', paddingRight: '15px' }}>
        <span style={{ color: 'var(--color-text)', fontSize: '0.85rem', fontWeight: 600 }}>{homeName}</span>
      </div>
      <div style={{ textAlign: 'center' }}>
        {match.status === 'pendiente' ? (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input type="number" id={'h' + match.id} min="0" style={{ width: '40px', textAlign: 'center', ...STYLE.inp }} />
            <span style={{ color: 'var(--color-text-muted)' }}>-</span>
            <input type="number" id={'a' + match.id} min="0" style={{ width: '40px', textAlign: 'center', ...STYLE.inp }} />
            <button onClick={() => {
              const hs = document.getElementById('h' + match.id).value;
              const as = document.getElementById('a' + match.id).value;
              onUpdate(match.id, hs, as);
            }} style={STYLE.btnSm}>?</button>
          </div>
        ) : (
          <span style={{ color: 'var(--color-primary)', fontWeight: 800, fontSize: '1.1rem' }}>
            {match.home_score} - {match.away_score}
          </span>
        )}
      </div>
      <div style={{ flex: 1, paddingLeft: '15px' }}>
        <span style={{ color: 'var(--color-text)', fontSize: '0.85rem', fontWeight: 600 }}>{awayName}</span>
      </div>
    </div>
  );
}
