import React, { useRef } from 'react';

const TEAM_COLORS = {
  orcos: '#065f46', cuervo: '#2A2D2B', cuervos: '#2A2D2B',
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

export function FixtureMatch({ match, onUpdate, onStats }) {
  const homeRef = useRef(null);
  const awayRef = useRef(null);
  const homeName = match.home?.rpg_name || match.home?.name || '—';
  const awayName = match.away?.rpg_name || match.away?.name || '—';
  const homeColor = match.home?.emblem_color || getTeamColor(match.home);
  const awayColor = match.away?.emblem_color || getTeamColor(match.away);
  const isJugado = match.status === 'jugado';
  const hs = parseInt(match.home_score) || 0;
  const as = parseInt(match.away_score) || 0;
  const homeWon = isJugado && hs > as;
  const awayWon = isJugado && as > hs;
  const draw = isJugado && hs === as;

  return (
    <div className={`vs-card${isJugado ? ' is-played' : ''}`}>
      <div className="vs-card-body">
        <div className="vs-card-team home">
          <div className="vs-card-crest" style={{ borderColor: '#334155' }}>
            {getInitials(homeName)}
          </div>
          <div className={`vs-card-team-name${homeWon ? ' is-winner' : ''}${!homeWon && isJugado && !draw ? ' is-loser' : ''}`}>
            {homeName}
          </div>
          {match.home?.is_external && <span className="vs-card-badge">I</span>}
        </div>

        <div className="vs-card-divider">
          <div className="vs-card-score-area">
            {isJugado ? (
              <div className="vs-card-score-display">
                <span className={`vs-card-score${homeWon ? ' is-winner' : ''}`}>{match.home_score}</span>
                <span className="vs-card-colon">:</span>
                <span className={`vs-card-score${awayWon ? ' is-winner' : ''}`}>{match.away_score}</span>
              </div>
            ) : (
              <div className="vs-card-score-inputs">
                <input ref={homeRef} type="number" min="0" placeholder="—" className="vs-card-input" />
                <span className="vs-card-colon">:</span>
                <input ref={awayRef} type="number" min="0" placeholder="—" className="vs-card-input" />
                <button onClick={() => {
                  const hs = homeRef.current?.value;
                  const as = awayRef.current?.value;
                  if (hs === '' || as === '' || hs === undefined || as === undefined) return;
                  onUpdate(match.id, hs, as);
                }} className="vs-card-save-btn">✓</button>
              </div>
            )}
          </div>
        </div>

        <div className="vs-card-team away">
          <div className={`vs-card-team-name${awayWon ? ' is-winner' : ''}${!awayWon && isJugado && !draw ? ' is-loser' : ''}`}>
            {awayName}
          </div>
          {match.away?.is_external && <span className="vs-card-badge">I</span>}
          <div className="vs-card-crest" style={{ borderColor: '#334155' }}>
            {getInitials(awayName)}
          </div>
        </div>
      </div>

      <div className="vs-card-footer">
        <div className="vs-card-team-dots">
          <span className="vs-card-dot" style={{ background: homeColor }} />
          <span className="vs-card-dot" style={{ background: awayColor }} />
        </div>
        {isJugado ? (
          <span className="vs-card-status is-played">Jugado</span>
        ) : (
          <span className="vs-card-status is-pending">Pendiente</span>
        )}
        {isJugado && onStats && (
          <button onClick={() => onStats(match)} className="vs-card-stats-btn">Stats</button>
        )}
      </div>
    </div>
  );
}
