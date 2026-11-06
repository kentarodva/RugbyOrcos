import { useState, useEffect, useCallback, useRef } from 'react';
import { ALIGNMENTS_HORIZONTAL, ALIGNMENTS_VERTICAL } from './constants';
import { DEFAULT_RIVALS_HORIZONTAL, PRESET_TV_PLAYS, mirrorToVertical } from './presetPlays';
import {
  fetchCustomTactics,
  createCustomTactic,
  updateCustomTactic,
  deleteCustomTactic,
  fetchMatchStatsByPlayer,
  createCustomTacticsChannel,
  removeRealtimeChannel,
} from '../../data/supabaseApi';
import { autoAssignLineup } from '../../engine/tacticAssignmentEngine';

export const PLAYBACK_SPEEDS = {
  '0.5x': { id: '0.5x', label: '0.5x Lento (Didáctico)', interval: 5600, duration: 2.5 },
  '0.75x': { id: '0.75x', label: '0.75x Pausado TV', interval: 4400, duration: 1.9 },
  '1x': { id: '1x', label: '1x Normal', interval: 3200, duration: 1.3 },
  '1.5x': { id: '1.5x', label: '1.5x Rápido', interval: 2200, duration: 0.9 },
};

const startsVertical = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 767px)').matches;

export function usePitchState(activeTeam) {
  const [lineup, setLineup] = useState({});
  const [tacticalNotes, setTacticalNotes] = useState('');
  const [pitchOrientation, setPitchOrientation] = useState(() => (startsVertical() ? 'vertical' : 'horizontal'));
  const [pitchSize, setPitchSize] = useState('medium');
  const [activeAlignment, setActiveAlignment] = useState('standard');

  const [fieldPositions, setFieldPositions] = useState(() => (startsVertical() ? ALIGNMENTS_VERTICAL.standard : ALIGNMENTS_HORIZONTAL.standard));
  const [prevFieldPositions, setPrevFieldPositions] = useState([]);

  // Broadcast TV Mode state (Rivals, Ball, Phases, Telestrator vectors)
  const [showRivals, setShowRivals] = useState(false);
  const [rivalPositions, setRivalPositions] = useState(() => DEFAULT_RIVALS_HORIZONTAL);
  const [prevRivalPositions, setPrevRivalPositions] = useState([]);
  const [showBall, setShowBall] = useState(true);
  const [ballPosition, setBallPosition] = useState({ x: 46, y: 45 });
  const [passFrom, setPassFrom] = useState(null);
  const [gainLineX, setGainLineX] = useState(null);
  const [highlightZone, setHighlightZone] = useState(null);
  const [activePlayId, setActivePlayId] = useState('');
  const [phases, setPhases] = useState([]);
  const [activePhaseIndex, setActivePhaseIndex] = useState(0);
  const [isPlayingPlay, setIsPlayingPlay] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState('0.75x');

  const currentSpeedConfig = PLAYBACK_SPEEDS[playbackSpeed] || PLAYBACK_SPEEDS['0.75x'];
  const animDuration = currentSpeedConfig.duration;

  const [draggingId, setDraggingId] = useState(null);
  const [dragStartPos, setDragStartPos] = useState(null);
  const [hasDragged, setHasDragged] = useState(false);

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [confirmState, setConfirmState] = useState(null);

  const [customTactics, setCustomTactics] = useState([]);
  const [activeTacticId, setActiveTacticId] = useState(null);
  const [autoAssignLoading, setAutoAssignLoading] = useState(false);
  const channelRef = useRef(null);
  const currentTacticRef = useRef(null);

  useEffect(() => {
    if (activeTeam) {
      setLineup({});
      setTacticalNotes('');
      setActiveTacticId(null);
      currentTacticRef.current = null;
      const defaults = pitchOrientation === 'horizontal' ? ALIGNMENTS_HORIZONTAL[activeAlignment] : ALIGNMENTS_VERTICAL[activeAlignment];
      setFieldPositions(defaults);
    }
  }, [activeTeam]);

  useEffect(() => {
    if (currentTacticRef.current && pitchOrientation) {
      const tactic = currentTacticRef.current;
      const positions = pitchOrientation === 'horizontal'
        ? tactic.positions_horizontal
        : tactic.positions_vertical;
      if (positions && positions.length > 0) {
        setFieldPositions(positions);
      }
    }
  }, [pitchOrientation]);

  const applyTacticToState = useCallback((tactic, orientation) => {
    if (!tactic) return;
    const alignmentMap = { union: 'standard', league: 'league_13s' };
    const targetAlignment = alignmentMap[tactic.formation_type] || tactic.formation_type || 'standard';
    currentTacticRef.current = tactic;

    const positions = orientation === 'horizontal'
      ? tactic.positions_horizontal
      : tactic.positions_vertical;

    if (positions && positions.length > 0) {
      setFieldPositions(positions);
    }
    setLineup(tactic.lineup && typeof tactic.lineup === 'object' ? tactic.lineup : {});
    setTacticalNotes(tactic.notes || '');
    setActiveAlignment(targetAlignment);
    setActiveTacticId(tactic.id);
  }, []);

  const loadCustomTactics = useCallback(async (teamCat) => {
    const tactics = await fetchCustomTactics(teamCat);
    setCustomTactics(tactics);

    if (tactics && tactics.length > 0 && !currentTacticRef.current) {
      const exactMatch = tactics.find(t => t.scope === teamCat) || tactics[0];
      applyTacticToState(exactMatch, pitchOrientation);
    }

    if (channelRef.current) {
      removeRealtimeChannel(channelRef.current);
      channelRef.current = null;
    }
    channelRef.current = createCustomTacticsChannel(teamCat, async () => {
      const refreshed = await fetchCustomTactics(teamCat);
      setCustomTactics(refreshed);
    });
  }, [applyTacticToState, pitchOrientation]);

  useEffect(() => {
    return () => {
      if (channelRef.current) {
        removeRealtimeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  const saveCurrentTactic = useCallback(async (name, scope, formationType) => {
    const otherOrientation = pitchOrientation === 'horizontal' ? 'vertical' : 'horizontal';
    const otherPositions = otherOrientation === 'horizontal' ? ALIGNMENTS_HORIZONTAL[activeAlignment] : ALIGNMENTS_VERTICAL[activeAlignment];

    const tacticData = {
      name,
      scope,
      formation_type: formationType || activeAlignment,
      positions_horizontal: pitchOrientation === 'horizontal' ? fieldPositions : otherPositions,
      positions_vertical: pitchOrientation === 'vertical' ? fieldPositions : otherPositions,
      lineup,
      notes: tacticalNotes,
    };
    const saved = await createCustomTactic(tacticData);
    if (saved) {
      setCustomTactics(prev => [saved, ...prev]);
      setActiveTacticId(saved.id);
      currentTacticRef.current = saved;
    }
    return saved;
  }, [fieldPositions, lineup, tacticalNotes, activeAlignment, pitchOrientation]);

  const handleDeleteTactic = useCallback(async (tacticId) => {
    const ok = await deleteCustomTactic(tacticId);
    if (ok) {
      setCustomTactics(prev => prev.filter(t => t.id !== tacticId));
      if (activeTacticId === tacticId) {
        setActiveTacticId(null);
        currentTacticRef.current = null;
      }
    }
    return ok;
  }, [activeTacticId]);

  const handleUpdateTactic = useCallback(async (tacticId, updates) => {
    const updated = await updateCustomTactic(tacticId, updates);
    if (updated) {
      setCustomTactics(prev => prev.map(t => t.id === tacticId ? updated : t));
    }
    return updated;
  }, []);

  const saveActiveTacticChanges = useCallback(async () => {
    if (!activeTacticId) return null;
    const current = currentTacticRef.current || {};
    const updates = {
      lineup,
      notes: tacticalNotes,
      positions_horizontal: pitchOrientation === 'horizontal' ? fieldPositions : (current.positions_horizontal || ALIGNMENTS_HORIZONTAL[activeAlignment]),
      positions_vertical: pitchOrientation === 'vertical' ? fieldPositions : (current.positions_vertical || ALIGNMENTS_VERTICAL[activeAlignment]),
    };
    const updated = await updateCustomTactic(activeTacticId, updates);
    if (updated) {
      currentTacticRef.current = updated;
      setCustomTactics(prev => prev.map(t => t.id === activeTacticId ? updated : t));
    }
    return updated;
  }, [activeTacticId, lineup, tacticalNotes, pitchOrientation, fieldPositions, activeAlignment]);

  const handleSelectTactic = useCallback((tacticId) => {
    const tactic = customTactics.find(t => t.id === tacticId);
    if (!tactic) {
      if (import.meta.env.DEV) console.warn('[Tactic] Not found:', tacticId);
      return;
    }
    applyTacticToState(tactic, pitchOrientation);
  }, [customTactics, pitchOrientation, applyTacticToState]);

  const executeAutoAssign = useCallback(async (players, filters = {}) => {
    if (!players || players.length === 0) {
      setAutoAssignLoading(false);
      return;
    }
    setAutoAssignLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const playerIds = players.filter(p =>
        p.estado === 'activo' || p.status === 'activo' || !p.estado
      ).map(p => p.id);

      if (playerIds.length === 0) {
        setAutoAssignLoading(false);
        return;
      }

      const matchStats = await fetchMatchStatsByPlayer(playerIds, filters, controller.signal);
      clearTimeout(timeoutId);

      const result = autoAssignLineup(
        players,
        matchStats,
        activeAlignment,
        fieldPositions,
        filters
      );

      if (Object.keys(result).length > 0) {
        setLineup(result);
      }
    } catch (err) {
      if (import.meta.env.DEV) console.warn('[AutoAssign] Error:', err?.message || err);
      if (err?.name === 'AbortError') {
        if (import.meta.env.DEV) console.warn('[AutoAssign] Timeout');
      }
    }
    clearTimeout(timeoutId);
    setAutoAssignLoading(false);
  }, [activeAlignment, fieldPositions]);

  const handleSlotClick = useCallback((slotId, slotName) => {
    setSelectedSlot({ id: slotId, name: slotName });
    setShowSelectModal(true);
  }, []);

  const assignPlayer = useCallback((playerId) => {
    setLineup(prev => {
      const newLineup = { ...prev };
      if (playerId === null) {
        delete newLineup[selectedSlot.id];
      } else {
        Object.keys(newLineup).forEach(key => {
          if (newLineup[key] === playerId) {
            delete newLineup[key];
          }
        });
        newLineup[selectedSlot.id] = playerId;
      }
      if (activeTacticId) {
        updateCustomTactic(activeTacticId, { lineup: newLineup }).then(updated => {
          if (updated) {
            currentTacticRef.current = updated;
            setCustomTactics(list => list.map(t => t.id === activeTacticId ? updated : t));
          }
        }).catch(() => {});
      }
      return newLineup;
    });
    setShowSelectModal(false);
  }, [selectedSlot, activeTacticId]);

  const clearField = useCallback(() => {
    setConfirmState({
      message: 'Deseas vaciar la alineacion completa?',
      onConfirm: () => setLineup({})
    });
  }, []);

  const handleAlignmentChange = useCallback((type) => {
    if (type && type.startsWith('custom_')) {
      const tacticId = type.replace('custom_', '');
      handleSelectTactic(tacticId);
      return;
    }

    setConfirmState({
      message: 'Deseas cambiar la formacion tactica de la pizarra?',
      onConfirm: () => {
        const selectedCoords = pitchOrientation === 'horizontal' ? ALIGNMENTS_HORIZONTAL[type] : ALIGNMENTS_VERTICAL[type];
        if (selectedCoords) {
          setFieldPositions(selectedCoords);
        }
        setActiveAlignment(type);
        setActiveTacticId(null);
        currentTacticRef.current = null;
      }
    });
  }, [pitchOrientation, handleSelectTactic]);

  const resetToDefaultPositions = useCallback(() => {
    setConfirmState({
      message: 'Deseas restablecer la formacion a la tactica estandar?',
      onConfirm: () => {
        const defaults = pitchOrientation === 'horizontal' ? ALIGNMENTS_HORIZONTAL[activeAlignment] : ALIGNMENTS_VERTICAL[activeAlignment];
        if (defaults) {
          setFieldPositions(defaults);
        }
      }
    });
  }, [pitchOrientation, activeAlignment]);

  const applyPhaseData = useCallback((phaseList, idx, orientation = pitchOrientation) => {
    if (!phaseList || !phaseList[idx]) return;
    const target = phaseList[idx];
    const prev = idx > 0 ? phaseList[idx - 1] : null;
    const isVert = orientation === 'vertical';
    const orientPt = (pt) => (pt && isVert ? { ...pt, x: pt.y, y: pt.x } : pt);

    const baseTemplate = isVert
      ? (ALIGNMENTS_VERTICAL[activeAlignment] || ALIGNMENTS_VERTICAL.standard)
      : (ALIGNMENTS_HORIZONTAL[activeAlignment] || ALIGNMENTS_HORIZONTAL.standard);

    const mergeAllies = (allyCoords) => {
      if (!allyCoords) return baseTemplate;
      return baseTemplate.map(slot => {
        const found = allyCoords.find(a => a.id === slot.id);
        if (!found) return slot;
        const pt = orientPt(found);
        return { ...slot, x: pt.x, y: pt.y };
      });
    };

    const mergeRivals = (rivalCoords) => {
      const baseRivals = isVert ? mirrorToVertical(DEFAULT_RIVALS_HORIZONTAL) : DEFAULT_RIVALS_HORIZONTAL;
      if (!rivalCoords) return baseRivals;
      return baseRivals.map(r => {
        const found = rivalCoords.find(rc => rc.id === r.id);
        if (!found) return r;
        const pt = orientPt(found);
        return { ...r, x: pt.x, y: pt.y };
      });
    };

    setIsAnimating(true);
    setPrevFieldPositions(prev ? mergeAllies(prev.allies) : []);
    setFieldPositions(mergeAllies(target.allies));
    setPrevRivalPositions(prev ? mergeRivals(prev.rivals) : []);
    setRivalPositions(mergeRivals(target.rivals));

    if (target.ball) {
      setBallPosition(orientPt(target.ball));
    }
    setPassFrom(target.passFrom ? orientPt(target.passFrom) : (prev?.ball ? orientPt(prev.ball) : null));
    setGainLineX(target.gainLineX ?? null);
    setHighlightZone(target.highlightZone ? orientPt(target.highlightZone) : null);
    setActivePhaseIndex(idx);
  }, [pitchOrientation, activeAlignment]);

  const handleSelectPresetPlay = useCallback((playId) => {
    const found = PRESET_TV_PLAYS.find(p => p.id === playId);
    if (!found) return;
    setActivePlayId(found.id);
    setPhases(found.phases);
    setShowRivals(true);
    setShowBall(true);
    setIsPlayingPlay(true);
    applyPhaseData(found.phases, 0, pitchOrientation);
  }, [applyPhaseData, pitchOrientation]);

  const handleSelectPhase = useCallback((idx) => {
    setIsPlayingPlay(false);
    applyPhaseData(phases, idx, pitchOrientation);
  }, [phases, applyPhaseData, pitchOrientation]);

  const handleCaptureCustomPhase = useCallback(() => {
    const isVert = pitchOrientation === 'vertical';
    const toCanonical = (pt) => (pt && isVert ? { ...pt, x: pt.y, y: pt.x } : pt);

    const newPhase = {
      title: `Fase ${phases.length + 1}: Movimiento Táctico Personalizado`,
      description: tacticalNotes || 'Arrastra jugadores, rivales o el balón para explicar la siguiente fase de juego.',
      ball: toCanonical(ballPosition),
      allies: fieldPositions.map(p => toCanonical({ id: p.id, x: p.x, y: p.y })),
      rivals: rivalPositions.map(r => toCanonical({ id: r.id, num: r.num, x: r.x, y: r.y })),
      gainLineX: gainLineX,
      highlightZone: highlightZone ? toCanonical(highlightZone) : null,
    };

    const nextPhases = [...phases, newPhase];
    setPhases(nextPhases);
    if (!activePlayId) setActivePlayId('custom_play');
    applyPhaseData(nextPhases, nextPhases.length - 1, pitchOrientation);
  }, [pitchOrientation, phases, tacticalNotes, ballPosition, fieldPositions, rivalPositions, gainLineX, highlightZone, activePlayId, applyPhaseData]);

  const handleExitPlaybook = useCallback(() => {
    setIsPlayingPlay(false);
    setIsAnimating(false);
    setActivePlayId('');
    setPhases([]);
    setActivePhaseIndex(0);
    setPrevFieldPositions([]);
    setPrevRivalPositions([]);
    setPassFrom(null);
    setGainLineX(null);
    setHighlightZone(null);
  }, []);

  const handlePrevPhase = useCallback(() => {
    if (phases.length <= 1) return;
    setIsPlayingPlay(false);
    const prevIdx = (activePhaseIndex - 1 + phases.length) % phases.length;
    applyPhaseData(phases, prevIdx, pitchOrientation);
  }, [phases, activePhaseIndex, applyPhaseData, pitchOrientation]);

  const handleNextPhase = useCallback(() => {
    if (phases.length <= 1) return;
    setIsPlayingPlay(false);
    const nextIdx = (activePhaseIndex + 1) % phases.length;
    applyPhaseData(phases, nextIdx, pitchOrientation);
  }, [phases, activePhaseIndex, applyPhaseData, pitchOrientation]);

  useEffect(() => {
    if (!isPlayingPlay || phases.length <= 1) return undefined;
    const intervalMs = currentSpeedConfig.interval;
    const timer = setTimeout(() => {
      const nextIdx = (activePhaseIndex + 1) % phases.length;
      applyPhaseData(phases, nextIdx, pitchOrientation);
    }, intervalMs);
    return () => clearTimeout(timer);
  }, [isPlayingPlay, phases, activePhaseIndex, applyPhaseData, pitchOrientation, currentSpeedConfig.interval]);

  const handleStartDrag = useCallback((e, posId) => {
    if (!e || posId === null) {
      setDraggingId(null);
      setDragStartPos(null);
      setHasDragged(false);
      return;
    }
    setIsPlayingPlay(false);
    setIsAnimating(false);
    setDraggingId(posId);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setDragStartPos({ x: clientX, y: clientY });
    setHasDragged(false);
    if (posId === 'BALL') {
      setPassFrom({ ...ballPosition });
    }
  }, [ballPosition]);

  const handleDragMove = useCallback((e, pitchRef) => {
    if (draggingId === null || !dragStartPos || !pitchRef.current) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const dist = Math.sqrt(Math.pow(clientX - dragStartPos.x, 2) + Math.pow(clientY - dragStartPos.y, 2));
    if (dist > 6) {
      setHasDragged(true);
    }

    const rect = pitchRef.current.getBoundingClientRect();
    let xPct = ((clientX - rect.left) / rect.width) * 100;
    let yPct = ((clientY - rect.top) / rect.height) * 100;

    xPct = Math.max(3, Math.min(97, xPct));
    yPct = Math.max(3, Math.min(97, yPct));

    if (draggingId === 'BALL') {
      setBallPosition({ x: xPct, y: yPct });
      return;
    }

    if (String(draggingId).startsWith('R')) {
      setRivalPositions(prev => prev.map(r => r.id === draggingId ? { ...r, x: xPct, y: yPct } : r));
      return;
    }

    setFieldPositions(prev => {
      return prev.map(pos => pos.id === draggingId ? { ...pos, x: xPct, y: yPct } : pos);
    });
  }, [draggingId, dragStartPos]);

  const handleEndDrag = useCallback((posId, posName) => {
    if (draggingId === null) return;
    const isAlliedSlot = typeof posId === 'number' || (!String(posId).startsWith('R') && posId !== 'BALL');
    if (!hasDragged && isAlliedSlot) {
      handleSlotClick(posId, posName);
    }
    setDraggingId(null);
    setDragStartPos(null);
    setHasDragged(false);
  }, [draggingId, hasDragged, handleSlotClick]);

  const isPlayerAligned = useCallback((playerId) => {
    return Object.values(lineup).includes(playerId);
  }, [lineup]);

  const getAvailableTeamCategories = useCallback(() => {
    const categories = new Set();
    customTactics.forEach(t => { if (t.scope !== 'all') categories.add(t.scope); });
    return Array.from(categories);
  }, [customTactics]);

  const activePhaseInfo = phases.length > 0 && phases[activePhaseIndex]
    ? {
        index: activePhaseIndex,
        total: phases.length,
        title: phases[activePhaseIndex].title,
        description: phases[activePhaseIndex].description,
      }
    : null;

  return {
    lineup, setLineup,
    tacticalNotes, setTacticalNotes,
    pitchOrientation, setPitchOrientation,
    pitchSize, setPitchSize,
    activeAlignment, setActiveAlignment,
    fieldPositions, setFieldPositions,
    prevFieldPositions,
    showRivals, setShowRivals,
    rivalPositions, setRivalPositions,
    prevRivalPositions,
    showBall, setShowBall,
    ballPosition, setBallPosition,
    passFrom, setPassFrom,
    gainLineX,
    highlightZone,
    activePlayId,
    phases,
    activePhaseIndex,
    activePhaseInfo,
    isPlayingPlay, setIsPlayingPlay,
    playbackSpeed, setPlaybackSpeed,
    animDuration,
    isAnimating,
    handleSelectPresetPlay,
    handleSelectPhase,
    handlePrevPhase,
    handleNextPhase,
    handleCaptureCustomPhase,
    handleExitPlaybook,
    draggingId, dragStartPos, hasDragged,
    selectedSlot, showSelectModal, setShowSelectModal,
    confirmState, setConfirmState,
    handleSlotClick, assignPlayer, clearField,
    handleAlignmentChange, resetToDefaultPositions,
    handleStartDrag, handleDragMove, handleEndDrag,
    isPlayerAligned,

    customTactics, setCustomTactics,
    activeTacticId,
    autoAssignLoading,
    loadCustomTactics,
    saveCurrentTactic,
    saveActiveTacticChanges,
    handleDeleteTactic,
    handleUpdateTactic,
    handleSelectTactic,
    executeAutoAssign,
    getAvailableTeamCategories,
  };
}
