import React, { useState } from 'react';
import {
  OrcosRugbyBallIcon,
  OrcosBattleAxeHPostsIcon,
  OrcosTackleShieldIcon,
  OrcosCardIcon,
} from '../../../common/OrcosIcons';

const ACTIONS = [
  { type: 'try', label: 'Try Orcos', pts: 5, color: 'var(--color-primary)', icon: OrcosRugbyBallIcon },
  { type: 'conversion', label: 'Conversión', pts: 2, color: 'var(--color-gold)', icon: OrcosBattleAxeHPostsIcon },
  { type: 'penalty', label: 'Penal a Postes', pts: 3, color: 'var(--color-orange)', icon: OrcosBattleAxeHPostsIcon },
  { type: 'drop_goal', label: 'Drop Goal', pts: 3, color: '#b388ff', icon: OrcosRugbyBallIcon },
];

function LiveScorer({
  players = [],
  liveMatch,
  onAddEvent,
  getElapsed,
  onSetScorer,
  currentUser,
  currentProfile,
  canManageMatch = false,
}) {
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [opponentPts, setOpponentPts] = useState(0);
  const [opponentNote, setOpponentNote] = useState('');
  const [isEditingScorer, setIsEditingScorer] = useState(false);
  const [scorerInput, setScorerInput] = useState(liveMatch?.designated_scorer_name || '');

  const designatedScorerName = liveMatch?.designated_scorer_name || '';
  const isLocked = Boolean(liveMatch?.scorer_locked && designatedScorerName);

  // Determine if the current viewer is the designated scorer or an admin
  const isUserDesignatedScorer = (() => {
    if (!designatedScorerName) return true;
    const myName = (currentProfile?.display_name || currentProfile?.name || '').toLowerCase();
    const myEmail = (currentUser?.email || '').toLowerCase();
    const target = designatedScorerName.toLowerCase();
    if (myName && target.includes(myName)) return true;
    if (myEmail && target.includes(myEmail)) return true;
    if (liveMatch?.designated_scorer_id && currentUser?.id === liveMatch.designated_scorer_id) return true;
    return false;
  })();

  const canScore = !isLocked || isUserDesignatedScorer || canManageMatch;

  const handleOrcosScore = (action) => {
    if (!canScore) return;
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
    if (!canScore || !opponentPts || opponentPts <= 0) return;
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

  const handleCardEvent = (cardType) => {
    if (!canScore) return;
    const minute = getElapsed();
    onAddEvent({
      eventType: cardType,
      playerId: selectedPlayer || null,
      team: 'orcos',
      minute,
      details: {
        player_name: selectedPlayer ? (players.find(p => p.id === selectedPlayer)?.name || '') : 'Equipo Orcos',
      },
    });
  };

  const handleSaveScorer = () => {
    const name = scorerInput.trim();
    onSetScorer?.(name, null, Boolean(name));
    setIsEditingScorer(false);
  };

  const handleClaimScorer = () => {
    const myName = currentProfile?.display_name || currentProfile?.name || currentUser?.email || 'Mesa Oficial';
    setScorerInput(myName);
    onSetScorer?.(myName, currentUser?.id || null, true);
  };

  const handleUnlockScorer = () => {
    onSetScorer?.('', null, false);
    setScorerInput('');
    setIsEditingScorer(false);
  };

  const playersForSelect = players.filter(p => p.rol !== 'Entrenador');
  const matchIsDisabled = liveMatch?.status === 'finished' || liveMatch?.status === 'delayed' || liveMatch?.status === 'paused';
  const actionsDisabled = matchIsDisabled || !canScore;

  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      {/* Mesa de Control Oficial Banner */}
      <div style={{
        background: isLocked ? 'rgba(0, 230, 118, 0.08)' : 'rgba(255, 255, 255, 0.03)',
        border: `1px solid ${isLocked ? 'rgba(0, 230, 118, 0.3)' : 'var(--color-border)'}`,
        borderRadius: '8px',
        padding: '10px 14px',
        marginBottom: '16px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <OrcosTackleShieldIcon size={20} color={isLocked ? 'var(--color-primary)' : 'var(--color-text-muted)'} />
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: isLocked ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
              Mesa de Control & Planillero Oficial
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>
              {designatedScorerName ? designatedScorerName : 'Sin asignar (Cualquiera en mesa puede anotar)'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {isEditingScorer ? (
            <div style={{ display: 'flex', gap: '4px' }}>
              <input
                type="text"
                placeholder="Nombre o Delegado FCR"
                value={scorerInput}
                onChange={e => setScorerInput(e.target.value)}
                className="form-input"
                style={{ fontSize: '0.75rem', padding: '4px 8px', width: '150px' }}
              />
              <button onClick={handleSaveScorer} className="btn-primary" style={{ fontSize: '0.7rem', padding: '4px 8px' }}>
                Guardar
              </button>
              <button onClick={handleUnlockScorer} className="btn-outline" style={{ fontSize: '0.7rem', padding: '4px 8px', color: 'var(--color-red)' }}>
                Liberar
              </button>
            </div>
          ) : (
            <>
              {isLocked && !isUserDesignatedScorer && (
                <button
                  onClick={handleClaimScorer}
                  className="btn-outline"
                  style={{ fontSize: '0.7rem', padding: '4px 10px', borderColor: 'var(--color-gold)', color: 'var(--color-gold)' }}
                  title="Tomar el control si eres el planillero designado en la cancha de Corozal"
                >
                  🙋‍♂️ Soy el Planillero
                </button>
              )}
              {canManageMatch && (
                <button
                  onClick={() => setIsEditingScorer(true)}
                  className="btn-outline"
                  style={{ fontSize: '0.7rem', padding: '4px 10px' }}
                >
                  ⚙️ Asignar Mesa
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {!canScore && (
        <div style={{
          background: 'rgba(255, 61, 0, 0.1)',
          border: '1px solid var(--color-red)',
          borderRadius: '6px',
          padding: '8px 12px',
          marginBottom: '14px',
          fontSize: '0.76rem',
          color: '#ffcdd2',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span>🛡️</span>
          <span><strong>Modo Espectador:</strong> La mesa de control está asignada exclusivamente a <strong>{designatedScorerName}</strong> para garantizar la fidelidad del acta oficial FCR.</span>
        </div>
      )}

      <h4 style={{ marginBottom: '15px', fontWeight: 800, fontSize: '0.85rem', color: 'var(--color-gold)', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <OrcosRugbyBallIcon size={16} color="var(--color-gold)" /> ANOTADOR RÁPIDO & DISCIPLINA
      </h4>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
          Guerrero en Jugada (opcional para tries y tarjetas)
        </label>
        <select
          value={selectedPlayer}
          onChange={e => setSelectedPlayer(e.target.value)}
          className="form-select"
          disabled={actionsDisabled}
        >
          <option value="">-- Sin jugador asignado / Colectivo --</option>
          {playersForSelect.map(p => (
            <option key={p.id} value={p.id}>
              #{p.camiseta ?? '—'} {p.name} ({p.posicion_principal || p.posicion || 'Campo'})
            </option>
          ))}
        </select>
      </div>

      {/* Main Scoring Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
        {ACTIONS.map(action => {
          const IconComp = action.icon;
          return (
            <button
              key={action.type}
              onClick={() => handleOrcosScore(action)}
              disabled={actionsDisabled}
              style={{
                background: action.color + '18',
                border: `1px solid ${action.color}60`,
                borderRadius: 'var(--radius-sm)',
                padding: '12px 8px',
                cursor: actionsDisabled ? 'not-allowed' : 'pointer',
                opacity: actionsDisabled ? 0.45 : 1,
                textAlign: 'center',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
              }}
              onMouseOver={e => { if (!actionsDisabled) e.currentTarget.style.background = action.color + '35'; }}
              onMouseOut={e => { if (!actionsDisabled) e.currentTarget.style.background = action.color + '18'; }}
            >
              <IconComp size={22} color={action.color} />
              <div style={{ fontSize: '0.78rem', fontWeight: 800, marginTop: '2px' }}>{action.label}</div>
              <div style={{ fontSize: '0.7rem', color: action.color, fontWeight: 900 }}>+{action.pts} pts</div>
            </button>
          );
        })}
      </div>

      {/* Cards & Discipline Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => handleCardEvent('yellow_card')}
          disabled={actionsDisabled}
          style={{
            background: 'rgba(255, 215, 64, 0.1)',
            border: '1px solid rgba(255, 215, 64, 0.4)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px',
            cursor: actionsDisabled ? 'not-allowed' : 'pointer',
            opacity: actionsDisabled ? 0.45 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '0.75rem',
            fontWeight: 800,
            color: 'var(--color-gold)',
          }}
        >
          <OrcosCardIcon size={16} color="#ffd740" />
          Tarjeta Amarilla (Sin-Bin 10m)
        </button>

        <button
          onClick={() => handleCardEvent('red_card')}
          disabled={actionsDisabled}
          style={{
            background: 'rgba(255, 23, 68, 0.1)',
            border: '1px solid rgba(255, 23, 68, 0.4)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px',
            cursor: actionsDisabled ? 'not-allowed' : 'pointer',
            opacity: actionsDisabled ? 0.45 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '0.75rem',
            fontWeight: 800,
            color: 'var(--color-red)',
          }}
        >
          <OrcosCardIcon size={16} color="#ff1744" />
          Tarjeta Roja (Expulsión)
        </button>
      </div>

      {/* Opponent Scoring */}
      <div style={{
        borderTop: '1px solid var(--color-border)',
        paddingTop: '14px',
      }}>
        <h5 style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: '8px', color: 'var(--color-text-muted)' }}>
          RIVAL — Puntos manuales (Visita)
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
            disabled={actionsDisabled}
            style={{ width: '80px', flexShrink: 0 }}
          />
          <input
            type="text"
            value={opponentNote}
            onChange={e => setOpponentNote(e.target.value)}
            placeholder="Ej: Try sin convertir, penal rival..."
            className="form-input"
            disabled={actionsDisabled}
            style={{ flex: 1 }}
          />
          <button
            onClick={handleOpponentScore}
            disabled={actionsDisabled || !opponentPts || opponentPts <= 0}
            className="btn-outline"
            style={{
              padding: '8px 14px',
              fontSize: '0.75rem',
              whiteSpace: 'nowrap',
              opacity: (!actionsDisabled && opponentPts > 0) ? 1 : 0.5,
            }}
          >
            Añadir Puntos
          </button>
        </div>
      </div>
    </div>
  );
}

export default LiveScorer;
