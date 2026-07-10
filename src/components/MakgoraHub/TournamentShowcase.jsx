import React from 'react';

const TEAM_COLORS = {
  orcos: '#065f46', cuervo: '#1f2937', cuervos: '#1f2937',
  troll: '#1e3a5f', trolls: '#1e3a5f',
  gargola: '#3b1f54', gargolas: '#3b1f54',
  pitbull: '#431407',
  buffalos: '#292524', bufalos: '#292524', buffalo: '#292524',
};

function getTeamColor(team) {
  if (!team) return '#334155';
  const name = (team.rpg_name || team.name || '').toLowerCase();
  for (const [key, color] of Object.entries(TEAM_COLORS)) {
    if (name.includes(key)) return color;
  }
  return '#334155';
}

function getInitials(name) {
  if (!name) return '--';
  return (name.match(/[A-Z]/g) || name.split(' ').map(w => w[0]).filter(Boolean)).slice(0, 2).join('').toUpperCase();
}

function TrophySVG() {
  return (
    <svg viewBox="0 0 80 96" width="72" height="86">
      <path d="M26 14h28v10c0 8-5 16-14 20-9-4-14-12-14-20V14z" fill="#c9a520" stroke="#a37f1a" strokeWidth="1" />
      <rect x="32" y="44" width="16" height="4" rx="1" fill="#a37f1a" />
      <rect x="26" y="48" width="28" height="4" rx="1" fill="#8a6b14" />
      <rect x="24" y="52" width="32" height="2" rx="1" fill="#6b520f" />
      <path d="M18 8a3 3 0 0 1 3-3h38a3 3 0 0 1 3 3" fill="none" stroke="#a37f1a" strokeWidth="1.5" />
      <path d="M40 14v4" stroke="#a37f1a" strokeWidth="1" />
      <path d="M34 19a6 6 0 0 0 12 0" fill="none" stroke="#a37f1a" strokeWidth="1" opacity="0.4" />
    </svg>
  );
}

export function TournamentShowcase({ tournament, teams, standings }) {
  const statusLabel = tournament.status === 'en_curso' ? 'En Curso' : tournament.status === 'finalizado' ? 'Finalizado' : 'Proximo';
  const statusColor = tournament.status === 'en_curso' ? '#c9a520' : tournament.status === 'finalizado' ? '#22c55e' : '#64748b';

  const sortedTeams = [...teams]
    .filter(t => t.is_active)
    .sort((a, b) => {
      const posA = standings.findIndex(s => s.team_id === a.id);
      const posB = standings.findIndex(s => s.team_id === b.id);
      if (posA === -1 && posB === -1) return (a.rpg_name || a.name || '').localeCompare(b.rpg_name || b.name || '');
      if (posA === -1) return 1;
      if (posB === -1) return -1;
      return posA - posB;
    });

  const mid = Math.ceil(sortedTeams.length / 2);
  const leftTeams = sortedTeams.slice(0, mid);
  const rightTeams = sortedTeams.slice(mid);

  return (
    <div className="showcase-root">
      <div className="showcase-header">
        <h2 className="showcase-title">MAK'GORA</h2>
        <p className="showcase-subtitle">{tournament.name}</p>
      </div>

      <div className="showcase-body">
        <div className="showcase-teams-col">
          {leftTeams.map(team => {
            const color = team.emblem_color || getTeamColor(team);
            const pos = standings.findIndex(s => s.team_id === team.id) + 1;
            const pts = standings.find(s => s.team_id === team.id)?.total_points;
            return (
              <div key={team.id} className="showcase-team-card">
                <div className="showcase-team-card-dot" style={{ background: color }} />
                <div className="showcase-team-crest">{getInitials(team.rpg_name || team.name)}</div>
                <div className="showcase-team-info">
                  <span className="showcase-team-name">{team.rpg_name || team.name}</span>
                  {pos > 0 && pts !== undefined && (
                    <span className="showcase-team-record">{pos}&deg; &middot; {pts} pts</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="showcase-center">
          <div className="showcase-trophy-wrap">
            <TrophySVG />
          </div>
          <div className="showcase-stats">
            <span className="showcase-stat-label">{standings.length || teams.filter(t => t.is_active).length} equipos</span>
            {tournament.total_matches && <span className="showcase-stat-label">{tournament.total_matches} partidos</span>}
            {tournament.total_rounds && <span className="showcase-stat-label">{tournament.total_rounds} rondas</span>}
          </div>
          <div className="showcase-status" style={{ borderColor: `${statusColor}44`, color: statusColor }}>
            <span className="showcase-status-dot" style={{ background: statusColor }} />
            {statusLabel}
          </div>
        </div>

        <div className="showcase-teams-col">
          {rightTeams.map(team => {
            const color = team.emblem_color || getTeamColor(team);
            const pos = standings.findIndex(s => s.team_id === team.id) + 1;
            const pts = standings.find(s => s.team_id === team.id)?.total_points;
            return (
              <div key={team.id} className="showcase-team-card">
                <div className="showcase-team-card-dot" style={{ background: color }} />
                <div className="showcase-team-crest">{getInitials(team.rpg_name || team.name)}</div>
                <div className="showcase-team-info">
                  <span className="showcase-team-name">{team.rpg_name || team.name}</span>
                  {pos > 0 && pts !== undefined && (
                    <span className="showcase-team-record">{pos}&deg; &middot; {pts} pts</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
