import { useState, useEffect, useCallback, useRef } from 'react';
import { ALIGNMENTS_HORIZONTAL, ALIGNMENTS_VERTICAL } from './constants';
import {
  fetchCustomTactics,
  createCustomTactic,
  updateCustomTactic,
  deleteCustomTactic,
  fetchMatchStatsByPlayer,
  createCustomTacticsChannel,
} from '../../data/supabaseApi';
import { autoAssignLineup } from '../../engine/tacticAssignmentEngine';

export function usePitchState(activeTeam) {
  const [lineup, setLineup] = useState({});
  const [tacticalNotes, setTacticalNotes] = useState('');
  const [pitchOrientation, setPitchOrientation] = useState('horizontal');
  const [pitchSize, setPitchSize] = useState('medium');
  const [activeAlignment, setActiveAlignment] = useState('standard');

  const [fieldPositions, setFieldPositions] = useState(() => ALIGNMENTS_HORIZONTAL.standard);

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
      applyTacticToState(tactics[0], pitchOrientation);
    }

    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }
    channelRef.current = createCustomTacticsChannel(teamCat, async () => {
      const refreshed = await fetchCustomTactics(teamCat);
      setCustomTactics(refreshed);
    });
  }, [applyTacticToState, pitchOrientation]);

  useEffect(() => {
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
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

  const handleStartDrag = useCallback((e, posId) => {
    setDraggingId(posId);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setDragStartPos({ x: clientX, y: clientY });
    setHasDragged(false);
  }, []);

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

    xPct = Math.max(5, Math.min(95, xPct));
    yPct = Math.max(3, Math.min(97, yPct));

    setFieldPositions(prev => {
      return prev.map(pos => pos.id === draggingId ? { ...pos, x: xPct, y: yPct } : pos);
    });
  }, [draggingId, dragStartPos]);

  const handleEndDrag = useCallback((posId, posName) => {
    if (draggingId === null) return;
    if (!hasDragged) {
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

  return {
    lineup, setLineup,
    tacticalNotes, setTacticalNotes,
    pitchOrientation, setPitchOrientation,
    pitchSize, setPitchSize,
    activeAlignment, setActiveAlignment,
    fieldPositions, setFieldPositions,
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
