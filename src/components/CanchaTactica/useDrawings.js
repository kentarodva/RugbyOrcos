import { useCallback, useEffect, useReducer } from 'react';
import { drawingReducer, initialDrawing } from './drawing';

const KEY = (scope) => `pizarra_drawings_${scope}`;

// Remembers which board the strokes belong to, so a board switch never saves
// the previous board's strokes under the new key.
const scopedReducer = (s, a) => ({ ...drawingReducer(s, a), scope: a.type === 'load' ? a.scope : s.scope });

function read(scope) {
  try {
    const raw = window.localStorage.getItem(KEY(scope));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Board drawings with undo/redo, remembered per board (team, clan or match) on this device. */
export function useDrawings(scope) {
  const [state, dispatch] = useReducer(scopedReducer, { ...initialDrawing, scope: null });

  useEffect(() => {
    dispatch({ type: 'load', strokes: read(scope), scope });
  }, [scope]);

  useEffect(() => {
    if (!state.scope) return;
    try {
      if (state.present.length) window.localStorage.setItem(KEY(state.scope), JSON.stringify(state.present));
      else window.localStorage.removeItem(KEY(state.scope));
    } catch { /* storage unavailable: drawings just won't persist */ }
  }, [state.present, state.scope]);

  return {
    strokes: state.present,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    add: useCallback((stroke) => dispatch({ type: 'add', stroke }), []),
    undo: useCallback(() => dispatch({ type: 'undo' }), []),
    redo: useCallback(() => dispatch({ type: 'redo' }), []),
    clear: useCallback(() => dispatch({ type: 'clear' }), []),
  };
}
