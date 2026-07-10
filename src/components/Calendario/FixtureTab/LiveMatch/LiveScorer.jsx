import React, { useState } from 'react';

const ACTIONS = [
  { type: 'try', label: 'Try', pts: 5, emoji: '🏉', color: 'var(--color-primary)' },
  { type: 'conversion', label: 'Conv', pts: 2, emoji: '⚡', color: 'var(--color-gold)' },
  { type: 'penalty', label: 'Penal', pts: 3, emoji: '🎯', color: 'var(--color-orange)' },
  { type: 'drop_goal', label: 'Drop', pts: 3, emoji: '🦵', color: 'var(--color-purple)' },
];

function LiveScorer({ players, liveMatch, onAddEvent, getElapsed }) {
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [opponentPts, setOpponentPts] = useState(0);
  const [opponentNote, setOpponentNote] = useState('');

  const handleOrcosScore = (action) => {
    const minute = getElapsed();
    onAddEvent({
      eventType: action.type,
      playerId: selectedPlayer || null,
      team: 'orcos',
      minute,
      details: selectedPlayer
        ? { player_name: players.find(p => p.id === selectedPlayer)?.name || '' }
        : {},
    });
  };

  const handleOpponentScore = () => {
    if (!opponentPts || opponentPts <= 0) return;
    const minute = getElapsed();
    onAddEvent({
      eventType: 'score_adjust',
      team: 'opponent',
      minute,
      details: { points: opponentPts, note: opponentNote },
    });
    setOpponentPts(0);
    setOpponentNote('');
  };

  const playersForSelect = players.filter(p => p.rol !== 'Entrenador');
  const filteredActions = liveMatch?.status === 'finished' || liveMatch?.status === 'paused';

  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      <h4 style={{ marginBottom: '15px', fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-gold)' }}>
        ⚔️ ANOTADOR RÁPIDO
      </h4>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
          Jugador (opcional para tries)
        </label>
        <select
          value={selectedPlayer}
          onChange={e => setSelectedPlayer(e.target.value)}
          className="form-select"
          disabled={filteredActions}
        >
          <option value="">-- Sin jugador --</option>
          {playersForSelect.map(p => (
            <option key={p.id} value={p.id}>
              #{p.camiseta ?? '—'} {p.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '15px' }}>
        {ACTIONS.map(action => (
          <button
            key={action.type}
            onClick={() => handleOrcosScore(action)}
            disabled={filteredActions}
            style={{
              background: action.color + '20',
              border: `1px solid ${action.color}50`,
              borderRadius: 'var(--radius-sm)',
              padding: '12px 8px',
              cursor: filteredActions ? 'not-allowed' : 'pointer',
              opacity: filteredActions ? 0.5 : 1,
              textAlign: 'center',
              transition: 'all 0.2s',
            }}
            onMouseOver={e => { if (!filteredActions) e.currentTarget.style.background = action.color + '40'; }}
            onMouseOut={e => { if (!filteredActions) e.currentTarget.style.background = action.color + '20'; }}
          >
            <div style={{ fontSize: '1.3rem' }}>{action.emoji}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, marginTop: '2px' }}>{action.label}</div>
            <div style={{ fontSize: '0.65rem', color: action.color, fontWeight: 800 }}>+{action.pts} pts</div>
          </button>
        ))}
      </div>

      <div style={{
        borderTop: '1px solid var(--color-border)',
        paddingTop: '15px',
        marginTop: '5px',
      }}>
        <h5 style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '10px', color: 'var(--color-text-muted)' }}>
          RIVAL — Puntos manuales
        </h5>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="number"
            min="0"
            max="99"
            value={opponentPts || ''}
            onChange={e => setOpponentPts(Number(e.target.value))}
            placeholder="Pts"
            className="form-input"
            disabled={filteredActions}
            style={{ width: '80px', flexShrink: 0 }}
          />
          <input
            type="text"
            value={opponentNote}
            onChange={e => setOpponentNote(e.target.value)}
            placeholder="Ej: Try rival"
            className="form-input"
            disabled={filteredActions}
            style={{ flex: 1 }}
          />
          <button
            onClick={handleOpponentScore}
            disabled={filteredActions || !opponentPts || opponentPts <= 0}
            className="btn-outline"
            style={{
              padding: '8px 12px',
              fontSize: '0.75rem',
              whiteSpace: 'nowrap',
              opacity: (!filteredActions && opponentPts > 0) ? 1 : 0.5,
            }}
          >
            Añadir
          </button>
        </div>
      </div>
    </div>
  );
}

export default LiveScorer;
