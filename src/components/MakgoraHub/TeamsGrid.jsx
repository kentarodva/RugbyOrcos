import React from 'react';

export function TeamsGrid({ teams }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
      {teams.map(t => (
        <div key={t.id} className="glass-panel" style={{ padding: '20px', textAlign: 'center', borderRadius: 'var(--radius-md)', borderTop: '3px solid ' + (t.emblem_color || '#00e676') }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>???</div>
          <h4 style={{ color: 'var(--color-gold)', fontSize: '0.9rem', fontWeight: 700 }}>{t.rpg_name || t.name}</h4>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>{t.name}</p>
        </div>
      ))}
    </div>
  );
}
