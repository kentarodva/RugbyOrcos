import React, { useRef, useMemo } from 'react';

const CARD_HEIGHT = 68;

const ROUND_LABELS = {
  1: { short: 'Final', long: 'Gran Final' },
  2: { short: 'Semifinales', long: 'Semifinales' },
  3: { short: 'Cuartos', long: 'Cuartos de Final' },
  4: { short: 'Octavos', long: 'Octavos de Final' },
};

function TrophySVG() {
  return (
    <svg viewBox="0 0 72 72" width="72" height="72" style={{ filter: 'drop-shadow(0 0 20px rgba(232, 185, 49,0.4))' }}>
      <defs>
        <radialGradient id="tg" cx="50%" cy="35%" r="55%">
          <stop offset="0%" stopColor="#ffe082" />
          <stop offset="45%" stopColor="#E8B931" />
          <stop offset="100%" stopColor="#e6a800" />
        </radialGradient>
      </defs>
      <path d="M24 16h24v8c0 7-4 14-12 18-8-4-12-11-12-18v-8z" fill="url(#tg)" stroke="#bf8f00" strokeWidth="1.5" />
      <rect x="30" y="38" width="12" height="3" rx="1.5" fill="#e6a800" />
      <rect x="26" y="41" width="20" height="3" rx="1.5" fill="#bf8f00" />
      <path d="M22 13a2 2 0 0 1 2-2h24a2 2 0 0 1 2 2" fill="none" stroke="#bf8f00" strokeWidth="1.5" />
      <ellipse cx="36" cy="52" rx="12" ry="2.5" fill="rgba(191,143,0,0.25)" />
      <path d="M28 23c-4-1-8-2-12-2" fill="none" stroke="#bf8f00" strokeWidth="1" opacity="0.4" />
      <path d="M44 23c4-1 8-2 12-2" fill="none" stroke="#bf8f00" strokeWidth="1" opacity="0.4" />
    </svg>
  );
}

function getRoundLabel(roundIdx, totalRounds) {
  const r = totalRounds - roundIdx;
  return ROUND_LABELS[r] || { short: `Ronda ${r}`, long: `Ronda ${r}` };
}

function TeamDot({ color }) {
  return (
    <div className="bracket-dot" style={{
      background: color,
      boxShadow: `0 0 4px ${color}`,
    }} />
  );
}

function BracketMatchCard({ match, teams, onUpdateMatch, side }) {
  const homeRef = useRef(null);
  const awayRef = useRef(null);
  const isPlaceholder = match._placeholder;
  const home = isPlaceholder ? null : (match.home_team_id ? teams.find(t => t.id === match.home_team_id) : null);
  const away = isPlaceholder ? null : (match.away_team_id ? teams.find(t => t.id === match.away_team_id) : null);
  const homeColor = home?.emblem_color || '#4fc3f7';
  const awayColor = away?.emblem_color || '#4fc3f7';
  const homeName = home?.rpg_name || home?.name;
  const awayName = away?.rpg_name || away?.name;
  const isJugado = match.status === 'jugado';
  const hs = parseInt(match.home_score) || 0;
  const as = parseInt(match.away_score) || 0;
  const homeWon = isJugado && hs > as;
  const awayWon = isJugado && as > hs;
  const hasTeams = !isPlaceholder && match.home_team_id && match.away_team_id;

  const sideClass = side === 'left' ? 'is-left' : side === 'right' ? 'is-right' : 'is-center';

  if (isPlaceholder) {
    return (
      <div className={`bracket-card ${sideClass}`} style={{ opacity: 0.35 }}>
        <div style={{ padding: '14px 10px', textAlign: 'center', fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
          Por definir
        </div>
      </div>
    );
  }

  return (
    <div className={`bracket-card ${sideClass}`}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '5px 8px',
        background: homeWon ? 'rgba(232, 185, 49,0.06)' : 'transparent',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        minHeight: '30px',
      }}>
        <TeamDot color={homeColor} />
        <span style={{
          flex: 1, fontSize: '0.68rem', fontWeight: homeWon ? 800 : 500,
          color: homeWon ? '#E8B931' : isJugado ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.8)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          fontFamily: 'var(--font-display)',
        }}>
          {homeName || 'Por definir'}
        </span>
        {isJugado ? (
          <span style={{ fontSize: '0.8rem', fontWeight: 900, fontFamily: 'var(--font-display)', color: homeWon ? '#E8B931' : 'rgba(255,255,255,0.4)', minWidth: '20px', textAlign: 'center' }}>
            {match.home_score}
          </span>
        ) : hasTeams ? (
          <input ref={homeRef} type="number" min="0" className="bracket-score-input" />
        ) : null}
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '5px 8px',
        background: awayWon ? 'rgba(232, 185, 49,0.06)' : 'transparent',
        minHeight: '30px',
      }}>
        <TeamDot color={awayColor} />
        <span style={{
          flex: 1, fontSize: '0.68rem', fontWeight: awayWon ? 800 : 500,
          color: awayWon ? '#E8B931' : isJugado ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.8)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          fontFamily: 'var(--font-display)',
        }}>
          {awayName || 'Por definir'}
        </span>
        {isJugado ? (
          <span style={{ fontSize: '0.8rem', fontWeight: 900, fontFamily: 'var(--font-display)', color: awayWon ? '#E8B931' : 'rgba(255,255,255,0.4)', minWidth: '20px', textAlign: 'center' }}>
            {match.away_score}
          </span>
        ) : hasTeams ? (
          <input ref={awayRef} type="number" min="0" className="bracket-score-input" />
        ) : null}
      </div>

      {hasTeams && !isJugado && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', padding: '2px 6px', background: 'rgba(0,0,0,0.15)' }}>
          <span className="bracket-status" style={{ background: 'rgba(232, 185, 49,0.08)', color: 'rgba(232, 185, 49,0.6)' }}>
            ⬤ Pendiente
          </span>
          <button onClick={() => {
            const h = homeRef.current?.value;
            const a = awayRef.current?.value;
            if (h !== '' && a !== '' && h !== undefined && a !== undefined) {
              onUpdateMatch(match.id, h, a);
            }
          }} style={{
            padding: '1px 8px', background: 'rgba(79,195,247,0.15)',
            border: '1px solid rgba(79,195,247,0.25)', borderRadius: '3px',
            color: '#4fc3f7', cursor: 'pointer', fontSize: '0.55rem',
            fontWeight: 700, fontFamily: 'var(--font-display)', marginLeft: 'auto',
          }}>
            OK
          </button>
        </div>
      )}
      {isJugado && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2px 6px', background: 'rgba(0,0,0,0.15)' }}>
          <span className="bracket-status" style={{ background: 'rgba(46, 229, 122,0.08)', color: 'rgba(46, 229, 122,0.6)' }}>
            ⬤ Jugado
          </span>
        </div>
      )}
    </div>
  );
}

function ConnectorPair({ side }) {
  return (
    <div className="connector-pair">
      <div className={`connector-v${side === 'right' ? ' is-right-side' : ''}`} />
    </div>
  );
}

export function PlayoffBracket({ matches, teams, onUpdateMatch }) {
  const tournamentTeams = useMemo(() => teams || [], [teams]);
  const playoffMatches = useMemo(() =>
    (matches || []).filter(m => m.phase === 'playoff'),
    [matches]
  );

  const bracket = useMemo(() => {
    if (playoffMatches.length === 0) return null;

    const pMatches = [...playoffMatches].sort((a, b) => a.round - b.round);
    const round1Count = pMatches.filter(m => m.round === 1).length;
    if (round1Count === 0) return null;

    const bracketSizeTotal = round1Count * 2;
    const totalRounds = Math.ceil(Math.log2(bracketSizeTotal));

    const placeholder = (round, idx) => ({
      id: `ph-${round}-${idx}`, round, phase: 'playoff',
      home_team_id: null, away_team_id: null,
      home_score: null, away_score: null,
      status: 'pendiente', _placeholder: true,
    });

    const col = (roundNum, side) => {
      const existing = pMatches.filter(x => x.round === roundNum);
      const matchesInRound = Math.max(round1Count / Math.pow(2, roundNum - 1), 1);
      const halfCount = Math.ceil(matchesInRound / 2);
      const ms = [];
      if (existing.length > 0) {
        const mid = Math.ceil(existing.length / 2);
        const slice = side === 'left' ? existing.slice(0, mid) : existing.slice(mid);
        for (let i = 0; i < halfCount; i++) {
          ms.push(slice[i] || placeholder(roundNum, i));
        }
      } else {
        for (let i = 0; i < halfCount; i++) {
          ms.push(placeholder(roundNum, i));
        }
      }
      return {
        round: roundNum,
        label: getRoundLabel(roundNum, totalRounds).long,
        matches: ms,
        maxCount: halfCount,
        side,
      };
    };

    const getFinal = (roundNum) => {
      const existing = pMatches.find(x => x.round === roundNum);
      return existing || placeholder(roundNum, 0);
    };

    switch (totalRounds) {
      case 1:
        return { columns: null, finalMatch: getFinal(1), totalRounds: 1 };
      case 2:
        return {
          columns: [col(1, 'left'), col(1, 'right')],
          finalMatch: getFinal(2),
          totalRounds: 2,
        };
      case 3:
        return {
          columns: [col(1, 'left'), col(2, 'left'), col(2, 'right'), col(1, 'right')],
          finalMatch: getFinal(3),
          totalRounds: 3,
        };
      default:
        return {
          columns: [col(1, 'left'), col(2, 'left'), col(2, 'right'), col(1, 'right')],
          finalMatch: getFinal(Math.min(4, totalRounds)),
          totalRounds: 4,
        };
    }
  }, [playoffMatches]);

  if (!bracket) return null;

  const renderColumn = (col, colIdx, totalCols) => {
    const isLastOnSide = colIdx === Math.ceil(totalCols / 2) - 1;
    return (
      <React.Fragment key={`${col.side}-${col.round}`}>
        <div className="bracket-col" style={{ minHeight: `${col.maxCount * CARD_HEIGHT}px` }}>
          <div className="bracket-round-label">{col.label}</div>
          {col.matches.map(m => (
            <BracketMatchCard
              key={m.id}
              match={m}
              teams={tournamentTeams}
              onUpdateMatch={onUpdateMatch}
              side={col.side}
            />
          ))}
        </div>
        {!isLastOnSide && (
          <div className="bracket-connector-col">
            {Array.from({ length: Math.max(Math.floor(col.matches.length / 2), 1) }).map((_, i) => (
              <ConnectorPair key={i} side={col.side} />
            ))}
          </div>
        )}
      </React.Fragment>
    );
  };

  if (bracket.totalRounds === 1) {
    return (
      <div className="bracket-root">
        <div className="bracket-texture" />
        <div className="bracket-overlay" />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '350px', gap: '20px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '8px', margin: 0, textShadow: '0 0 30px rgba(79,195,247,0.3)' }}>
            Playoffs
          </h1>
          <div style={{ width: '60px', height: '2px', background: 'linear-gradient(90deg,transparent,#4fc3f7,transparent)' }} />
          <BracketMatchCard match={bracket.finalMatch} teams={tournamentTeams} onUpdateMatch={onUpdateMatch} side="center" />
          <TrophySVG />
        </div>
      </div>
    );
  }

  const leftCols = bracket.columns.filter(c => c.side === 'left');
  const rightCols = bracket.columns.filter(c => c.side === 'right').reverse();

  return (
    <div className="bracket-root">
      <div className="bracket-texture" />
      <div className="bracket-overlay" />
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ textAlign: 'center', padding: '20px 20px 10px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '8px', margin: 0, textShadow: '0 0 30px rgba(79,195,247,0.3), 0 2px 4px rgba(0,0,0,0.5)' }}>
            Playoffs
          </h1>
          <div style={{ width: '60px', height: '2px', background: 'linear-gradient(90deg,transparent,#4fc3f7,transparent)', margin: '8px auto 0' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '0 16px 20px', overflowX: 'auto', flex: 1 }}>
          {leftCols.map((col, idx) => renderColumn(col, idx, leftCols.length))}

          {bracket.totalRounds >= 3 && leftCols.length > 0 && (
            <div className="bracket-connector-col">
              <ConnectorPair side="left" />
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', alignSelf: 'center' }}>
            <BracketMatchCard match={bracket.finalMatch} teams={tournamentTeams} onUpdateMatch={onUpdateMatch} side="center" />
            <TrophySVG />
          </div>

          {bracket.totalRounds >= 3 && rightCols.length > 0 && (
            <div className="bracket-connector-col">
              <ConnectorPair side="right" />
            </div>
          )}

          {rightCols.map((col, idx) => renderColumn(col, idx, rightCols.length))}
        </div>
      </div>
    </div>
  );
}
