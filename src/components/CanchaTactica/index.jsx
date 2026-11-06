import React, { useRef, useMemo } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { ClubContext } from '../../context/ClubContext';
import { useTeamPlayers } from '../../context/hooks/useFilterByView';
import { usePitchState } from './usePitchState';
import PitchField from './PitchField';
import DrawingLayer from './DrawingLayer';
import DrawToolbar from './DrawToolbar';
import { useDrawings } from './useDrawings';
import PitchControls from './PitchControls';
import PlaybookBar from './PlaybookBar';
import PlaysPanel from './PlaysPanel';
import PhaseStrip from './PhaseStrip';
import { usePlayLibrary } from './usePlayLibrary';
import { ALL_TV_PLAYS, playTitle } from './playLibrary';
import BenchPanel from './BenchPanel';
import StrategyNotes from './StrategyNotes';
import PlayerSelectModal from './PlayerSelectModal';
import ConfirmModal from './ConfirmModal';
import SaveTacticModal from './SaveTacticModal';
import TacticFiltersModal from './TacticFiltersModal';
import { copyOrDownloadTacticalImage, buildLineupWhatsAppText } from '../../utils/exportPitchImage';
import { copyToClipboard } from '../../utils/whatsappUtils';
import { formatTeamCategory } from '../../context/constants';
import { printOfficialMatchSheet } from '../../utils/exportPdf';
import { AcademiaLeyesModal } from './AcademiaLeyesModal';

const TOUCH_LAYOUT_QUERY = '(max-width: 767px), (pointer: coarse) and (max-width: 1100px)';

function CanchaTactica() {
  const { players, activeTeam, futureFixtures, makgoraTeams = [], viewMode, makgoraTeamId, hasPermission } = React.useContext(ClubContext);
  const canEditPlays = typeof hasPermission === 'function' ? hasPermission('manage_tactics') : false;
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
    prevFieldPositions,
    showRivals, setShowRivals,
    rivalPositions,
    prevRivalPositions,
    showBall, setShowBall,
    ballPosition,
    passFrom,
    gainLineX,
    highlightZone,
    activePlayId,
    phases,
    activePhaseIndex,
    activePhaseInfo,
    isPlayingPlay, setIsPlayingPlay,
    playbackSpeed, setPlaybackSpeed,
    animDuration,
    handlePrevPhase, handleNextPhase,
    isAnimating,
    handleSelectPresetPlay,
    handleSelectPhase,
    handleCaptureCustomPhase,
    handleExitPlaybook,
    handleLoadPlay, handleRemoveLastPhase,
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

  const [showSaveModal, setShowSaveModal] = React.useState(false);
  const [showFilterModal, setShowFilterModal] = React.useState(false);
  const [showAcademia, setShowAcademia] = React.useState(false);
  // Phones (also in landscape) and touch tablets get the pitch-first layout.
  const isMobile = useIsMobile(TOUCH_LAYOUT_QUERY);
  // On phones the pitch is already full width; "large" only made it taller and covered the screen.
  const effectivePitchSize = isMobile ? 'medium' : pitchSize;
  const isLargeFullscreen = effectivePitchSize === 'large';

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

  const boardTitle = useMemo(() => {
    if (nextMatch && selectedMatchId) {
      return `Partido: vs ${nextMatch.opponent} (${nextMatch.date})`;
    }
    if (boardScope.startsWith('makgora_')) {
      const mId = boardScope.replace('makgora_', '');
      const mt = makgoraTeams.find(x => String(x.id) === String(mId));
      return `Clan Mak'Gora: ${mt?.rpg_name || mt?.name || mId}`;
    }
    return `División: ${formatTeamCategory(boardScope)}`;
  }, [nextMatch, selectedMatchId, boardScope, makgoraTeams]);

  const handleExportBroadcastImage = async () => {
    const isVert = pitchOrientation === 'vertical';
    const toH = (pt) => (pt && isVert ? { ...pt, x: pt.y, y: pt.x } : pt);
    return copyOrDownloadTacticalImage({
      title: boardTitle,
      subtitle: nextMatch ? `Próximo Partido: ${nextMatch.date} vs ${nextMatch.opponent}` : 'Rugby Orcos Club Manager',
      fieldPositions: fieldPositions.map(toH),
      prevFieldPositions: prevFieldPositions.map(toH),
      lineup,
      teamPlayers,
      showRivals,
      rivalPositions: rivalPositions.map(toH),
      prevRivalPositions: prevRivalPositions.map(toH),
      showBall,
      ballPosition: toH(ballPosition),
      passFrom: toH(passFrom),
      gainLineX,
      highlightZone: toH(highlightZone),
      activePhaseInfo,
      tacticalNotes,
      drawings: drawings.strokes,
    });
  };

  const handlePrintOfficialPdf = () => {
    const division = formatTeamCategory(effectiveScope) || 'Masculina Mayor';
    printOfficialMatchSheet({
      match: nextMatch || {},
      lineup,
      players: teamPlayers,
      teamLabel: 'Rugby Orcos Negros Club',
      division,
    });
  };

  const handleCopyLineupWhatsApp = async () => {
    const text = buildLineupWhatsAppText({
      title: boardTitle,
      lineup,
      teamPlayers,
      tacticalNotes,
      activePhaseInfo,
    });
    await copyToClipboard(text);
  };

  const [pitchView, setPitchView] = React.useState('half');
  const [drawing, setDrawing] = React.useState(false);
  const [drawTool, setDrawTool] = React.useState('run');
  const drawings = useDrawings(effectiveScope);
  const playLibrary = usePlayLibrary(effectiveScope, canEditPlays);
  const [mobilePanel, setMobilePanel] = React.useState('tactica');
  const [fullscreen, setFullscreen] = React.useState(false);

  // Fullscreen board: freeze the page behind it and let Escape close it.
  React.useEffect(() => {
    if (!fullscreen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') setFullscreen(false); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [fullscreen]);

  const scopeSelect = (
    <select
      value={boardScope}
      onChange={e => { setBoardScope(e.target.value); setSelectedMatchId(''); }}
      className="form-select"
      style={isMobile ? { width: '100%' } : { padding: '4px 10px', fontSize: '0.8125rem', fontWeight: 600, width: 'auto', maxWidth: '100%' }}
      title="Seleccionar equipo o clan Mak'Gora para esta pizarra"
    >
      <optgroup label="Divisiones Oficiales">
        {teamCategories.map(tc => (
          <option key={tc} value={tc}>{formatTeamCategory(tc)}</option>
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
  );
  const matchSelect = upcomingMatches.length > 0 && (
  <select
    value={selectedMatchId}
    onChange={e => setSelectedMatchId(e.target.value)}
    className="form-select"
    style={isMobile ? { width: '100%' } : { padding: '4px 10px', fontSize: '0.8125rem', width: 'auto', maxWidth: '100%' }}
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
);
  const controlsPanel = (
    <PitchControls
      activeAlignment={activeAlignment}
      pitchOrientation={pitchOrientation}
      setPitchOrientation={setPitchOrientation}
      pitchSize={pitchSize}
      setPitchSize={isMobile ? null : setPitchSize}
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
  );
  const sharePanel = (
    <PlaybookBar
      onExportImage={handleExportBroadcastImage}
      onCopyWhatsAppText={handleCopyLineupWhatsApp}
      onPrintOfficialPdf={handlePrintOfficialPdf}
      onOpenAcademia={() => setShowAcademia(true)}
    />
  );
  const playsPanel = (
    <PlaysPanel
      activePlayId={activePlayId}
      phases={phases}
      onSelectPreset={handleSelectPresetPlay}
      onLoadPlay={handleLoadPlay}
      onExit={handleExitPlaybook}
      onCapture={handleCaptureCustomPhase}
      onRemoveLastPhase={handleRemoveLastPhase}
      showRivals={showRivals}
      onToggleRivals={() => setShowRivals(prev => !prev)}
      showBall={showBall}
      onToggleBall={() => setShowBall(prev => !prev)}
      library={playLibrary}
      canEdit={canEditPlays}
    />
  );
  const activePlayTitle = activePlayId === 'custom_play'
    ? 'Jugada nueva (sin guardar)'
    : playTitle(ALL_TV_PLAYS.find(p => p.id === activePlayId)) || playLibrary.plays.find(p => p.id === activePlayId)?.name || 'Jugada';
  const phaseStrip = (
    <PhaseStrip
      title={activePlayTitle}
      phases={phases}
      activeIndex={activePhaseIndex}
      isPlaying={isPlayingPlay}
      onTogglePlay={() => setIsPlayingPlay(prev => !prev)}
      onPrev={handlePrevPhase}
      onNext={handleNextPhase}
      onSelect={handleSelectPhase}
      speed={playbackSpeed}
      onSpeed={setPlaybackSpeed}
      onExit={handleExitPlaybook}
    />
  );
  const renderPitch = (fit = false) => (
    <PitchField
      fieldPositions={fieldPositions}
      prevFieldPositions={prevFieldPositions}
      lineup={lineup}
      teamPlayers={teamPlayers}
      draggingId={draggingId}
      pitchOrientation={pitchOrientation}
      pitchSize={effectivePitchSize}
      pitchRef={pitchRef}
      showRivals={showRivals}
      rivalPositions={rivalPositions}
      prevRivalPositions={prevRivalPositions}
      showBall={showBall}
      ballPosition={ballPosition}
      passFrom={passFrom}
      gainLineX={gainLineX}
      highlightZone={highlightZone}
      activePhaseInfo={null}
      isAnimating={isAnimating}
      animDuration={animDuration}
      onStartDrag={handleStartDrag}
      onDragMove={boundDragMove}
      onEndDrag={handleEndDrag}
      view={isMobile ? pitchView : 'full'}
      fitHeight={fit}
      availabilities={nextMatch?.availabilities || {}}
    >
      <DrawingLayer strokes={drawings.strokes} orientation={pitchOrientation} active={drawing} tool={drawTool} onAdd={drawings.add} />
    </PitchField>
  );
  const modalLayer = (
    <>
      {showSelectModal && selectedSlot && (
        <PlayerSelectModal
          selectedSlot={selectedSlot}
          teamPlayers={teamPlayers}
          isPlayerAligned={isPlayerAligned}
          lineup={lineup}
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

      {showAcademia && (
        <AcademiaLeyesModal
          onClose={() => setShowAcademia(false)}
        />
      )}
    </>
  );

  const viewToggle = (
    <div className="segmented" role="group" aria-label="Vista de la cancha" style={{ flex: 1 }}>
      {[['half', 'Mitad'], ['full', 'Completa']].map(([v, l]) => (
        <button key={v} type="button" aria-pressed={pitchView === v}
          className={pitchView === v ? 'is-on' : ''} onClick={() => setPitchView(v)}>{l}</button>
      ))}
    </div>
  );

  const drawToggle = (
    <button type="button" aria-pressed={drawing} onClick={() => setDrawing(d => !d)}
      className={drawing ? 'btn-neon btn-sm' : 'btn-outline btn-sm'} style={{ flexShrink: 0 }}>
      {drawing ? 'Listo' : '✎ Dibujar'}
    </button>
  );
  const drawToolbar = drawing && (
    <DrawToolbar tool={drawTool} onTool={setDrawTool}
      canUndo={drawings.canUndo} canRedo={drawings.canRedo} canClear={drawings.strokes.length > 0}
      onUndo={drawings.undo} onRedo={drawings.redo} onClear={drawings.clear} />
  );

  if (isMobile) {
    const panels = [['tactica', 'Táctica'], ['jugadas', 'Jugadas'], ['banca', 'Banca'], ['compartir', 'Compartir']];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <header style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h1 className="page-title">Pizarra XV</h1>
          {scopeSelect}
          {matchSelect}
        </header>

        {!fullscreen && renderPitch(false)}

        <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
          {viewToggle}
          {drawToggle}
          <button type="button" className="btn-outline btn-sm" onClick={() => setFullscreen(true)}
            aria-label="Pantalla completa" title="Pantalla completa" style={{ minWidth: '44px', fontSize: '1rem' }}>⛶</button>
        </div>
        {drawToolbar}
        {phaseStrip}
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', margin: 0 }}>
          {drawing
            ? 'Arrastra el dedo sobre la cancha para trazar. Toca «Listo» para volver a mover jugadores.'
            : 'Toca una posición para elegir jugador. Arrastra el círculo para moverla.'}
        </p>

        <div className="segmented" role="tablist" aria-label="Herramientas de la pizarra" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
          {panels.map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={mobilePanel === id}
              className={mobilePanel === id ? 'is-on' : ''} onClick={() => setMobilePanel(id)}>{label}</button>
          ))}
        </div>

        {mobilePanel === 'tactica' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {controlsPanel}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button type="button" onClick={resetToDefaultPositions} className="btn-outline btn-sm">Restablecer posiciones</button>
              <button type="button" onClick={clearField} className="btn-outline btn-sm">Vaciar cancha</button>
            </div>
          </div>
        )}
        {mobilePanel === 'jugadas' && playsPanel}
        {mobilePanel === 'banca' && (
          <>
            <BenchPanel lineup={lineup} teamPlayers={teamPlayers} onSlotClick={handleSlotClick} />
            <StrategyNotes tacticalNotes={tacticalNotes} onChange={setTacticalNotes} />
          </>
        )}
        {mobilePanel === 'compartir' && sharePanel}

        {fullscreen && (
          <div className="pz-fullscreen" role="dialog" aria-label="Pizarra en pantalla completa">
            <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
              {viewToggle}
              {drawToggle}
              <button type="button" className="btn-outline btn-sm" onClick={() => setFullscreen(false)}>Salir</button>
            </div>
            {drawToolbar}
            <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '100%' }}>{renderPitch(true)}</div>
            </div>
          </div>
        )}

        {modalLayer}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
      <div className="animated-fade" style={{
        display: 'grid',
        gridTemplateColumns: isLargeFullscreen ? '1fr' : 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
        gap: '20px', width: '100%'
      }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h1 className="page-title" style={{ width: '100%' }}>
                  {isLargeFullscreen ? 'Pizarra táctica' : 'Pizarra XV'}
                </h1>
                {scopeSelect}
                {matchSelect}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '3px' }}>Arrastra los círculos para mover posiciones o tócalos para alinear guerreros.</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={resetToDefaultPositions} className="btn-outline btn-sm">
                Restablecer posiciones
              </button>
              <button type="button" onClick={clearField} className="btn-outline btn-sm">
                Vaciar cancha
              </button>
            </div>
          </div>

          {controlsPanel}

          {sharePanel}
          {playsPanel}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>{drawToggle}</div>
            {drawToolbar}
          </div>
          {renderPitch(false)}
          {phaseStrip}
        </div>

        {(
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

      {modalLayer}
    </div>
  );
}

export default CanchaTactica;
