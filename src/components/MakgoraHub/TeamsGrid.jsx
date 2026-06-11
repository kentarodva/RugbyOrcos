import React from 'react';

function getTeamEmoji(team) {
  const name = (team.name || team.rpg_name || '').toLowerCase();
  if (name.includes('orco')) return '🛡️';
  if (name.includes('cuervo')) return '🦅';
  if (name.includes('troll')) return '🧊';
  if (name.includes('gargola')) return '🗿';
  if (name.includes('pitbull')) return '🐕';
  if (name.includes('bufalo') || name.includes('buffalo')) return '🦬';
  return '⚔️';
}

export function TeamsGrid({ teams }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
      {teams.map(t => (
        <div key={t.id} className="glass-panel" style={{ padding: '20px', textAlign: 'center', borderRadius: 'var(--radius-md)', borderTop: '3px solid ' + (t.emblem_color || '#00e676') }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '8px', filter: 'drop-shadow(0 0 6px rgba(255,179,0,0.3))' }}>{getTeamEmoji(t)}</div>
          <h4 style={{ color: 'var(--color-gold)', fontSize: '0.9rem', fontWeight: 700 }}>{t.rpg_name || t.name}</h4>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>{t.name}</p>
        </div>
      ))}
    </div>
  );
}
