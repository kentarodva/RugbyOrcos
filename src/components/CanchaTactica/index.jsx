import React, { useRef } from 'react';
import { ClubContext } from '../../context/ClubContext';
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
  const { players, activeTeam, viewMode, divisionView, makgoraTeamId } = React.useContext(ClubContext);
  const pitchRef = useRef(null);

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

    customTactics,
    activeTacticId,
    autoAssignLoading,
    loadCustomTactics,
    saveCurrentTactic,
    handleDeleteTactic,
    handleUpdateTactic,
    executeAutoAssign,
  } = usePitchState(activeTeam);

  const [showSidebar, setShowSidebar] = React.useState(true);
  const [showSaveModal, setShowSaveModal] = React.useState(false);
  const [showFilterModal, setShowFilterModal] = React.useState(false);

  const prevPitchSize = React.useRef(pitchSize);
  React.useEffect(() => {
    if (pitchSize === 'large' && prevPitchSize.current !== 'large') {
      setShowSidebar(false);
    }
    prevPitchSize.current = pitchSize;
  }, [pitchSize]);

  const isLargeFullscreen = pitchSize === 'large' && !showSidebar;

  const teamPlayers = React.useMemo(() => {
    if (viewMode === 'general' && divisionView === 'all') {
      return players.filter(p => p.teamCategory?.startsWith('orcos') && p.rol !== 'Entrenador');
    }
    if (viewMode === 'general') {
      return players.filter(p => p.teamCategory === `orcos_${divisionView}` && p.rol !== 'Entrenador');
    }
    if (viewMode === 'makgora' && makgoraTeamId) {
      let filtered = players.filter(p => p.makgora_team_id === makgoraTeamId && p.rol !== 'Entrenador');
      if (divisionView !== 'all') {
        filtered = filtered.filter(p => p.teamCategory === `orcos_${divisionView}`);
      }
      return filtered;
    }
    return players.filter(p => p.teamCategory === activeTeam && p.rol !== 'Entrenador');
  }, [players, viewMode, divisionView, makgoraTeamId, activeTeam]);

  // Get available team categories from the context for the scope selector
  const teamCategories = React.useMemo(() => {
    const cats = new Set(players.map(p => p.teamCategory).filter(Boolean));
    return Array.from(cats);
  }, [players]);

  // Load custom tactics when activeTeam changes
  React.useEffect(() => {
    if (activeTeam) {
      loadCustomTactics(activeTeam);
    }
  }, [activeTeam, loadCustomTactics]);

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

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'Outfit' }}>
                {isLargeFullscreen ? 'Pizarra Tactica — Vista Completa' : 'Pizarra de Alineaciones (XV Inicial)'}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Arrastra los circulos para mover posiciones o tocalos para alinear orcos.</p>
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
