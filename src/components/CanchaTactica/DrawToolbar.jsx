import React from 'react';
import { DRAW_TOOLS } from './drawing';

/** Tool picker + undo/redo/clear shown while drawing. */
function DrawToolbar({ tool, onTool, canUndo, canRedo, canClear, onUndo, onRedo, onClear }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="segmented" role="group" aria-label="Herramienta de dibujo" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        {Object.entries(DRAW_TOOLS).map(([id, t]) => (
          <button key={id} type="button" aria-pressed={tool === id} className={tool === id ? 'is-on' : ''} onClick={() => onTool(id)}>
            <span aria-hidden="true" style={{
              display: 'inline-block', width: 16, height: 0, marginRight: 8, verticalAlign: 'middle',
              borderTop: `3px ${t.dash ? 'dashed' : 'solid'} ${t.color}`,
            }} />
            {t.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button type="button" className="btn-outline btn-sm" onClick={onUndo} disabled={!canUndo}>Deshacer</button>
        <button type="button" className="btn-outline btn-sm" onClick={onRedo} disabled={!canRedo}>Rehacer</button>
        <button type="button" className="btn-outline btn-sm" onClick={onClear} disabled={!canClear} style={{ marginLeft: 'auto' }}>Borrar dibujos</button>
      </div>
    </div>
  );
}

export default DrawToolbar;
