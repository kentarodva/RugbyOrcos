import React from 'react';
import { getAvatarPath } from '../../data/mythicalAvatars';

const TEAM_CRESTS = [
  { keys: ['orcos', 'horda'], avatar: 'dragon-head', gradient: 'linear-gradient(135deg, #0a3d1a, #00e676)' },
  { keys: ['cuervos', 'cuervo'], avatar: 'raven', gradient: 'linear-gradient(135deg, #1a1a1a, #616161)' },
  { keys: ['trolls', 'troll'], avatar: 'troll', gradient: 'linear-gradient(135deg, #0a2a4a, #2196f3)' },
  { keys: ['gargolas', 'gargola'], avatar: 'gargoyle', gradient: 'linear-gradient(135deg, #2a0a3a, #9c27b0)' },
  { keys: ['pitbull'], avatar: 'wolf-head', gradient: 'linear-gradient(135deg, #3d1500, #ff6d00)' },
  { keys: ['buffalos', 'bufalos', 'buffalo'], avatar: 'boar-tusks', gradient: 'linear-gradient(135deg, #2a1a0a, #795548)' },
];

function getCrest(team) {
  const name = ((team.rpg_name || team.name || '') + ' ' + (team.name || '')).toLowerCase();
  return TEAM_CRESTS.find(c => c.keys.some(k => name.includes(k))) || TEAM_CRESTS[0];
}

export function TeamsGrid({ teams }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
      {teams.map(t => {
        const crest = getCrest(t);
        const color = t.emblem_color || '#00e676';
        return (
          <div key={t.id} className="glass-panel" style={{
            padding: '24px', textAlign: 'center', borderRadius: 'var(--radius-md)',
            borderTop: '3px solid ' + color, position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: crest.gradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px auto',
              boxShadow: `0 0 20px ${color}66, inset 0 0 30px rgba(0,0,0,0.3)`,
              border: '2px solid ' + color,
            }}>
              <img
                src={getAvatarPath(crest.avatar)}
                alt={t.rpg_name || t.name}
                style={{ width: '48px', height: '48px', filter: 'brightness(0) invert(1)' }}
              />
            </div>
            <h4 style={{ color: 'var(--color-gold)', fontSize: '0.95rem', fontWeight: 800, fontFamily: 'Outfit' }}>
              {t.rpg_name || t.name}
            </h4>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.72rem' }}>{t.name}</p>
          </div>
        );
      })}
    </div>
  );
}
