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

function migrateLocalStorage(activeTeam) {
  // Migrar posiciones: de clave sin alignment a clave con alignment
  const alignments = Object.keys(ALIGNMENTS_HORIZONTAL);
  ['horizontal', 'vertical'].forEach(orientation => {
    alignments.forEach(alignment => {
      const oldKey = `orcos_positions_coords_${orientation}_${activeTeam}`;
      const newKey = `orcos_positions_coords_${alignment}_${orientation}_${activeTeam}`;
      const oldData = localStorage.getItem(oldKey);
      if (oldData && !localStorage.getItem(newKey)) {
        localStorage.setItem(newKey, oldData);
      }
    });
  });
}

export function usePitchState(activeTeam) {
  const [lineup, setLineup] = useState(() => {
    const saved = localStorage.getItem(`orcos_lineup_${activeTeam}`);
    return saved ? JSON.parse(saved) : {};
  });

  const [tacticalNotes, setTacticalNotes] = useState(() => {
    return localStorage.getItem(`orcos_notes_${activeTeam}`) || '';
  });

  const [pitchOrientation, setPitchOrientation] = useState(() => {
    return localStorage.getItem('orcos_pitch_orientation') || 'horizontal';
  });

  const [pitchSize, setPitchSize] = useState(() => {
    return localStorage.getItem('orcos_pitch_size') || 'medium';
  });

  const [activeAlignment, setActiveAlignment] = useState('standard');

  const [fieldPositions, setFieldPositions] = useState(() => {
    migrateLocalStorage(activeTeam);
    const key = `orcos_positions_coords_standard_horizontal_${activeTeam}`;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : ALIGNMENTS_HORIZONTAL.standard;
  });

  const [draggingId, setDraggingId] = useState(null);
  const [dragStartPos, setDragStartPos] = useState(null);
  const [hasDragged, setHasDragged] = useState(false);

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [confirmState, setConfirmState] = useState(null);

  // Custom tactics state
  const [customTactics, setCustomTactics] = useState([]);
  const [activeTacticId, setActiveTacticId] = useState(null);
  const [autoAssignLoading, setAutoAssignLoading] = useState(false);
  const channelRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(`orcos_lineup_${activeTeam}`, JSON.stringify(lineup));
  }, [lineup, activeTeam]);

  useEffect(() => {
    localStorage.setItem(`orcos_notes_${activeTeam}`, tacticalNotes);
  }, [tacticalNotes, activeTeam]);

  useEffect(() => {
    localStorage.setItem('orcos_pitch_orientation', pitchOrientation);
  }, [pitchOrientation]);

  useEffect(() => {
    localStorage.setItem('orcos_pitch_size', pitchSize);
  }, [pitchSize]);

  useEffect(() => {
    migrateLocalStorage(activeTeam);
    const savedLineup = localStorage.getItem(`orcos_lineup_${activeTeam}`);
    setLineup(savedLineup ? JSON.parse(savedLineup) : {});

    const key = `orcos_positions_coords_${activeAlignment}_${pitchOrientation}_${activeTeam}`;
    const savedPositions = localStorage.getItem(key);
    const defaults = pitchOrientation === 'horizontal' ? ALIGNMENTS_HORIZONTAL[activeAlignment] : ALIGNMENTS_VERTICAL[activeAlignment];
    setFieldPositions(savedPositions ? JSON.parse(savedPositions) : defaults);

    setTacticalNotes(localStorage.getItem(`orcos_notes_${activeTeam}`) || '');
  }, [activeTeam, pitchOrientation, activeAlignment]);

  // Load custom tactics from Supabase
  const loadCustomTactics = useCallback(async (teamCat) => {
    const tactics = await fetchCustomTactics(teamCat);
    setCustomTactics(tactics);

    // Subscribe to Realtime
    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }
    channelRef.current = createCustomTacticsChannel(teamCat, async () => {
      const refreshed = await fetchCustomTactics(teamCat);
      setCustomTactics(refreshed);
    });
  }, []);

  // Cleanup channel on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, []);

  // Save current tactic to Supabase
  const saveCurrentTactic = useCallback(async (name, scope, formationType) => {
    const otherOrientation = pitchOrientation === 'horizontal' ? 'vertical' : 'horizontal';
    const otherKey = `orcos_positions_coords_${activeAlignment}_${otherOrientation}_${activeTeam}`;
    const savedOther = localStorage.getItem(otherKey);
    const otherPositions = savedOther
      ? JSON.parse(savedOther)
      : (otherOrientation === 'horizontal' ? ALIGNMENTS_HORIZONTAL[activeAlignment] : ALIGNMENTS_VERTICAL[activeAlignment]);

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
    }
    return saved;
  }, [fieldPositions, lineup, tacticalNotes, activeAlignment, pitchOrientation, activeTeam]);

  // Delete tactic
  const handleDeleteTactic = useCallback(async (tacticId) => {
    const ok = await deleteCustomTactic(tacticId);
    if (ok) {
      setCustomTactics(prev => prev.filter(t => t.id !== tacticId));
      if (activeTacticId === tacticId) {
        setActiveTacticId(null);
      }
    }
    return ok;
  }, [activeTacticId]);

  // Update tactic
  const handleUpdateTactic = useCallback(async (tacticId, updates) => {
    const updated = await updateCustomTactic(tacticId, updates);
    if (updated) {
      setCustomTactics(prev => prev.map(t => t.id === tacticId ? updated : t));
    }
    return updated;
  }, []);

  // Select a saved tactic
  const handleSelectTactic = useCallback((tacticId) => {
    const tactic = customTactics.find(t => t.id === tacticId);
    if (!tactic) {
      if (import.meta.env.DEV) console.warn('[Tactic] Not found:', tacticId);
      return;
    }

    // Mapear formation_type al alignment correspondiente
    const alignmentMap = { union: 'standard', league: 'league_13s' };
    const targetAlignment = alignmentMap[tactic.formation_type] || tactic.formation_type || 'standard';
    console.log('[Tactic] Loading:', tactic.name, '→ alignment:', targetAlignment);

    // Guardar AMBAS orientaciones en localStorage para que persistan al cambiar vista
    const horKey = `orcos_positions_coords_${targetAlignment}_horizontal_${activeTeam}`;
    const verKey = `orcos_positions_coords_${targetAlignment}_vertical_${activeTeam}`;
    localStorage.setItem(horKey, JSON.stringify(tactic.positions_horizontal));
    localStorage.setItem(verKey, JSON.stringify(tactic.positions_vertical));

    // Mostrar la orientación actual
    const positions = pitchOrientation === 'horizontal'
      ? tactic.positions_horizontal
      : tactic.positions_vertical;

    if (positions && positions.length > 0) {
      setFieldPositions(positions);
    }

    if (tactic.lineup && Object.keys(tactic.lineup).length > 0) {
      setLineup(tactic.lineup);
    }

    if (tactic.notes) {
      setTacticalNotes(tactic.notes);
    }

    setActiveAlignment(targetAlignment);
    setActiveTacticId(tactic.id);
  }, [customTactics, pitchOrientation, activeTeam]);

  // Auto-assign players using Hungarian Algorithm
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
        if (import.meta.env.DEV) console.warn('[AutoAssign] Timeout — consulta a Supabase cancelada');
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
      return newLineup;
    });
    setShowSelectModal(false);
  }, [selectedSlot]);

  const clearField = useCallback(() => {
    setConfirmState({
      message: '¿Deseas vaciar la alineacion completa?',
      onConfirm: () => setLineup({})
    });
  }, []);

  const handleAlignmentChange = useCallback((type) => {
    // If it's a custom tactic from the dropdown (custom_{id}), select it
    if (type && type.startsWith('custom_')) {
      const tacticId = type.replace('custom_', '');
      handleSelectTactic(tacticId);
      return;
    }

    setConfirmState({
      message: `¿Deseas cambiar la formacion tactica de la pizarra?`,
      onConfirm: () => {
        const selectedCoords = pitchOrientation === 'horizontal' ? ALIGNMENTS_HORIZONTAL[type] : ALIGNMENTS_VERTICAL[type];
        if (selectedCoords) {
          setFieldPositions(selectedCoords);
          localStorage.setItem(`orcos_positions_coords_${type}_${pitchOrientation}_${activeTeam}`, JSON.stringify(selectedCoords));
        }
        setActiveAlignment(type);
        setActiveTacticId(null);
      }
    });
  }, [pitchOrientation, activeTeam, handleSelectTactic]);

  const resetToDefaultPositions = useCallback(() => {
    setConfirmState({
      message: '¿Deseas restablecer la formacion a la tactica estandar?',
      onConfirm: () => {
        const defaults = pitchOrientation === 'horizontal' ? ALIGNMENTS_HORIZONTAL[activeAlignment] : ALIGNMENTS_VERTICAL[activeAlignment];
        if (defaults) {
          setFieldPositions(defaults);
          localStorage.setItem(`orcos_positions_coords_${activeAlignment}_${pitchOrientation}_${activeTeam}`, JSON.stringify(defaults));
        }
      }
    });
  }, [pitchOrientation, activeAlignment, activeTeam]);

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
      const updated = prev.map(pos => pos.id === draggingId ? { ...pos, x: xPct, y: yPct } : pos);
      const key = `orcos_positions_coords_${activeAlignment}_${pitchOrientation}_${activeTeam}`;
      localStorage.setItem(key, JSON.stringify(updated));
      return updated;
    });
  }, [draggingId, dragStartPos, pitchOrientation, activeTeam, activeAlignment]);

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
    handleDeleteTactic,
    handleUpdateTactic,
    handleSelectTactic,
    executeAutoAssign,
    getAvailableTeamCategories,
  };
}
