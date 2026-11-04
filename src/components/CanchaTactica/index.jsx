import React, { useRef, useMemo } from 'react';
import { ClubContext } from '../../context/ClubContext';
import { useTeamPlayers } from '../../context/hooks/useFilterByView';
import { usePitchState } from './usePitchState';
import PitchField from './PitchField';
import PitchControls from './PitchControls';
import BenchPanel from './BenchPanel';
import StrategyNotes from './StrategyNotes';
import PlayerSelectModal from './PlayerSelectModal';
import ConfirmModal from './ConfirmModal';
import SaveTacticModal from './SaveTacticModal';
import TacticFiltersModal from './TacticFiltersModal';

function CanchaTactica() {
  const { players, activeTeam, futureFixtures, makgoraTeams = [], viewMode, makgoraTeamId } = React.useContext(ClubContext);
  const pitchRef = useRef(null);

  const initialScope = viewMode === 'makgora' && makgoraTeamId
    ? `makgora_${makgoraTeamId}`
    : (activeTeam || 'orcos_masculina_mayor');

  const [boardScope, setBoardScope] = React.useState(initialScope);

  React.useEffect(() => {
    if (viewMode === 'makgora' && makgoraTeamId) {
      setBoardScope(`makgora_${makgoraTeamId}`);
    } else if (activeTeam && !boardScope.startsWith('makgora_') && !boardScope.startsWith('match_')) {
      setBoardScope(activeTeam);
    }
  }, [viewMode, makgoraTeamId, activeTeam]);

  const upcomingMatches = useMemo(() => {
    const today = new Date(new Date().toDateString());
    return (futureFixtures || [])
      .filter(f => new Date(f.date + 'T00:00:00') >= today)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [futureFixtures]);

  const [selectedMatchId, setSelectedMatchId] = React.useState('');

  const nextMatch = useMemo(() => {
    if (selectedMatchId) {
      return upcomingMatches.find(m => String(m.id) === String(selectedMatchId)) || upcomingMatches[0] || null;
    }
    if (!boardScope.startsWith('makgora_')) {
      return upcomingMatches.find(f => !f.teamCategory || f.teamCategory === boardScope) || upcomingMatches[0] || null;
    }
    return upcomingMatches[0] || null;
  }, [upcomingMatches, selectedMatchId, boardScope]);

  const effectiveScope = selectedMatchId ? `match_${selectedMatchId}` : boardScope;

  const {
    lineup, tacticalNotes, setTacticalNotes,
    pitchOrientation, setPitchOrientation,
    pitchSize, setPitchSize,
    activeAlignment,
    fieldPositions,
    draggingId,
    selectedSlot, showSelectModal, setShowSelectModal,
    confirmState, setConfirmState,
    handleSlotClick, assignPlayer, clearField,
    handleAlignmentChange, resetToDefaultPositions,
    handleStartDrag, handleDragMove, handleEndDrag,
    isPlayerAligned,
    customTactics, activeTacticId, autoAssignLoading,
    loadCustomTactics, saveCurrentTactic, saveActiveTacticChanges,
    handleDeleteTactic, handleUpdateTactic,
    executeAutoAssign,
  } = usePitchState(effectiveScope);

  const [showSidebar, setShowSidebar] = React.useState(true);
  const [showSaveModal, setShowSaveModal] = React.useState(false);
  const [showFilterModal, setShowFilterModal] = React.useState(false);
  const isLargeFullscreen = pitchSize === 'large';

  const allTeamPlayers = useTeamPlayers();
  const teamPlayers = useMemo(() => {
    const activeNonCoach = (players || []).filter(p => !p.deleted_at && p.rol !== 'Entrenador');
    if (boardScope.startsWith('makgora_')) {
      const mId = boardScope.replace('makgora_', '');
      return activeNonCoach.filter(p => String(p.makgora_team_id) === String(mId));
    }
    if (boardScope && boardScope !== 'all') {
      const byCat = activeNonCoach.filter(p => p.teamCategory === boardScope);
      if (byCat.length > 0) return byCat;
    }
    return allTeamPlayers.filter(p => p.rol !== 'Entrenador');
  }, [players, boardScope, allTeamPlayers]);

  // Get available team categories from the context for the scope selector
  const teamCategories = React.useMemo(() => {
    const cats = new Set(players.map(p => p.teamCategory).filter(Boolean));
    return Array.from(cats);
  }, [players]);

  // Load custom tactics when effectiveScope changes
  React.useEffect(() => {
    if (effectiveScope) {
      loadCustomTactics(effectiveScope);
    }
  }, [effectiveScope, loadCustomTactics]);

  const boundDragMove = (e) => handleDragMove(e, pitchRef);

  const handleSaveTactic = async (name, scope, formationType) => {
    const result = await saveCurrentTactic(name, scope, formationType);
    return result;
  };

  const handleAutoAssign = async (filters) => {
    if (filters.mode === 'custom') {
      setShowFilterModal(true);
      return;
    }
    await executeAutoAssign(teamPlayers, filters);
  };

  const handleAutoAssignWithFilters = async (filters) => {
    await executeAutoAssign(teamPlayers, filters);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
      <div className="animated-fade" style={{
        display: 'grid',
        gridTemplateColumns: isLargeFullscreen ? '1fr' : 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px', width: '100%'
      }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'Outfit', margin: 0 }}>
                  {isLargeFullscreen ? 'Pizarra Táctica — Vista Completa' : 'Pizarra de Alineaciones (XV Inicial)'}
                </h3>
                <select
                  value={boardScope}
                  onChange={e => { setBoardScope(e.target.value); setSelectedMatchId(''); }}
                  className="form-select"
                  style={{ padding: '4px 10px', fontSize: '0.76rem', fontWeight: 700, width: 'auto' }}
                  title="Seleccionar equipo o clan Mak'Gora para esta pizarra"
                >
                  <optgroup label="Divisiones Oficiales">
                    {teamCategories.map(tc => (
                      <option key={tc} value={tc}>{tc}</option>
                    ))}
                  </optgroup>
                  {makgoraTeams.length > 0 && (
                    <optgroup label="Clanes Mak'Gora (Aislados)">
                      {makgoraTeams.map(mt => (
                        <option key={mt.id} value={`makgora_${mt.id}`}>
                          ⚔️ Mak'Gora: {mt.rpg_name || mt.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                {upcomingMatches.length > 0 && (
                  <select
                    value={selectedMatchId}
                    onChange={e => setSelectedMatchId(e.target.value)}
                    className="form-select"
                    style={{ padding: '4px 10px', fontSize: '0.75rem', width: 'auto', color: 'var(--color-primary)', borderColor: 'rgba(0,230,118,0.3)' }}
                    title="Filtrar disponibilidad y guardar pizarra para un partido específico"
                  >
                    <option value="">
                      Partido activo: {nextMatch ? `${nextMatch.date} vs ${nextMatch.opponent} (${Object.values(nextMatch.availabilities || {}).filter(v => v === 'going').length} conf.)` : 'General'}
                    </option>
                    {upcomingMatches.map(m => (
                      <option key={m.id} value={m.id}>
                        📅 {m.date} vs {m.opponent} ({Object.values(m.availabilities || {}).filter(v => v === 'going').length} confirmados)
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '3px' }}>Arrastra los círculos para mover posiciones o tócalos para alinear guerreros.</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={resetToDefaultPositions} className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem', color: 'var(--color-gold)', borderColor: 'rgba(255, 179, 0, 0.2)' }}>
                Reset Tactico
              </button>
              <button onClick={clearField} className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem', color: 'var(--color-red)', borderColor: 'rgba(255, 61, 0, 0.2)' }}>
                Limpiar
              </button>
            </div>
          </div>

          <PitchControls
            activeAlignment={activeAlignment}
            pitchOrientation={pitchOrientation}
            setPitchOrientation={setPitchOrientation}
            pitchSize={pitchSize}
            setPitchSize={setPitchSize}
            onAlignmentChange={handleAlignmentChange}

            customTactics={customTactics}
            activeTacticId={activeTacticId}
            autoAssignLoading={autoAssignLoading}
            onSaveTactic={() => setShowSaveModal(true)}
            onUpdateActiveTactic={activeTacticId ? saveActiveTacticChanges : null}
            onAutoAssign={handleAutoAssign}
            onDeleteTactic={handleDeleteTactic}
            onRenameTactic={handleUpdateTactic}
          />

          <PitchField
            fieldPositions={fieldPositions}
            lineup={lineup}
            teamPlayers={teamPlayers}
            draggingId={draggingId}
            pitchOrientation={pitchOrientation}
            pitchSize={pitchSize}
            pitchRef={pitchRef}
            onStartDrag={handleStartDrag}
            onDragMove={boundDragMove}
            onEndDrag={handleEndDrag}
          />
        </div>

        {!isLargeFullscreen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <BenchPanel
              lineup={lineup}
              teamPlayers={teamPlayers}
              onSlotClick={handleSlotClick}
            />

            <StrategyNotes
              tacticalNotes={tacticalNotes}
              onChange={setTacticalNotes}
            />
          </div>
        )}
      </div>

      {isLargeFullscreen && (
        <button
          onClick={() => setShowSidebar(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 999,
            background: 'var(--bg-surface-solid)',
            border: '2px solid var(--color-primary)',
            color: 'var(--color-primary)',
            padding: '12px 20px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 800,
            fontSize: '0.85rem',
            cursor: 'pointer',
            boxShadow: '0 0 20px var(--color-primary-glow)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'var(--transition-smooth)',
          }}
        >
          ⚡ Banca y Notas
        </button>
      )}

      {pitchSize === 'large' && showSidebar && (
        <div
          className="glass-panel animated-slide"
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 998,
            maxWidth: '500px',
            width: '90%',
            maxHeight: '85vh',
            overflowY: 'auto',
            padding: '24px',
            border: '2px solid var(--color-primary)',
            boxShadow: '0 0 40px rgba(0, 230, 118, 0.2)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, fontFamily: 'Outfit' }}>Banca y Notas Tacticas</h3>
            <button
              onClick={() => setShowSidebar(false)}
              className="btn-outline"
              style={{ padding: '4px 12px', fontSize: '0.75rem' }}
            >
              ✕ Cerrar
            </button>
          </div>
          <BenchPanel
            lineup={lineup}
            teamPlayers={teamPlayers}
            onSlotClick={handleSlotClick}
          />
          <div style={{ marginTop: '16px' }}>
            <StrategyNotes
              tacticalNotes={tacticalNotes}
              onChange={setTacticalNotes}
            />
          </div>
        </div>
      )}

      {showSelectModal && selectedSlot && (
        <PlayerSelectModal
          selectedSlot={selectedSlot}
          teamPlayers={teamPlayers}
          isPlayerAligned={isPlayerAligned}
          availabilities={nextMatch?.availabilities || {}}
          onAssign={assignPlayer}
          onClose={() => setShowSelectModal(false)}
        />
      )}

      <ConfirmModal
        confirmState={confirmState}
        onConfirm={() => {
          confirmState.onConfirm();
          setConfirmState(null);
        }}
        onCancel={() => setConfirmState(null)}
      />

      {showSaveModal && (
        <SaveTacticModal
          formationType={activeAlignment}
          teamCategories={teamCategories}
          makgoraTeams={makgoraTeams}
          upcomingMatches={upcomingMatches}
          defaultScope={effectiveScope}
          onSave={handleSaveTactic}
          onClose={() => setShowSaveModal(false)}
        />
      )}

      {showFilterModal && (
        <TacticFiltersModal
          onAssign={handleAutoAssignWithFilters}
          onClose={() => setShowFilterModal(false)}
        />
      )}
    </div>
  );
}

export default CanchaTactica;
