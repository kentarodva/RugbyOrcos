import React from 'react';
import TeamCrest from '../common/TeamCrest';

// The founding clan carries the club's official crest until staff uploads its own.
const isFoundingClan = (t) => /orcos|horda/i.test(`${t.rpg_name || ''} ${t.name || ''}`);

export function clanCrestUrl(team) {
  if (team.crest_url) return team.crest_url;
  return isFoundingClan(team) ? '/assets/orcos_crest_light.png' : null;
}

function Stat({ value, label, color = '#fff' }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 0 }}>
      <div style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '1.05rem', color, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--color-text-muted)', fontWeight: 700 }}>{label}</div>
    </div>
  );
}

/** Clan banners: crest, war motto, all-time record (W-D-L), tries for and assigned warriors. */
export function TeamsGrid({ teams, onTeamClick, records = {}, players = [] }) {
  const internalTeams = teams.filter(t => !t.is_external);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 230px), 1fr))', gap: '16px' }}>
      {internalTeams.map(t => {
        const color = t.emblem_color || '#00e676';
        const rec = records[t.id] || { won: 0, drawn: 0, lost: 0, triesFor: 0 };
        const warriors = players.filter(p => p.makgora_team_id === t.id).length;
        const name = t.rpg_name || t.name;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onTeamClick?.(t)}
            aria-label={`Ver clan ${name}`}
            style={{
              all: 'unset', boxSizing: 'border-box', cursor: onTeamClick ? 'pointer' : 'default',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
              padding: '22px 16px 34px', textAlign: 'center', position: 'relative',
              background: `linear-gradient(180deg, ${color}26 0%, rgba(14, 24, 36, 0.96) 38%, rgba(10, 15, 24, 0.98) 100%)`,
              border: `1px solid ${color}55`, borderTop: `4px solid ${color}`,
              // Banner tail: notched bottom edge
              clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% calc(100% - 18px), 0 100%)',
              boxShadow: `0 10px 30px rgba(0,0,0,0.45)`,
            }}
          >
            <TeamCrest url={clanCrestUrl(t)} name={name} color={color} size={92} rounded="18%" glow />
            <div style={{ minWidth: 0, width: '100%' }}>
              <h4 style={{ margin: 0, color: '#fff', fontSize: '1rem', fontWeight: 900, fontFamily: 'Outfit', letterSpacing: '0.3px' }}>{name}</h4>
              {t.rpg_name && t.name && t.rpg_name !== t.name && (
                <p style={{ margin: '2px 0 0', color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>{t.name}</p>
              )}
              <p style={{ margin: '6px 0 0', color, fontSize: '0.74rem', fontStyle: 'italic', fontWeight: 600, minHeight: '1.1em' }}>
                {t.motto ? `«${t.motto}»` : ''}
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', width: '100%', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <Stat value={`${rec.won}-${rec.drawn}-${rec.lost}`} label="G-E-P" color={color} />
              <Stat value={rec.triesFor} label="Tries" />
              <Stat value={warriors} label="Guerreros" />
            </div>
          </button>
        );
      })}
    </div>
  );
}
