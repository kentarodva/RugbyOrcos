import React, { useState } from 'react';
import { ALIGNMENTS_LABELS } from './constants';

function PitchControls({
  activeAlignment,
  pitchOrientation,
  setPitchOrientation,
  pitchSize,
  setPitchSize,
  onAlignmentChange,

  customTactics = [],
  onSaveTactic,
  onUpdateActiveTactic,
  onAutoAssign,
  activeTacticId,
  autoAssignLoading,
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const autoAssignRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (autoAssignRef.current && !autoAssignRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const label = { fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 500 };
  const menuItem = {
    display: 'block', width: '100%', minHeight: '44px', padding: '0 14px', fontSize: '0.875rem', textAlign: 'left',
    border: 'none', borderRadius: 0, background: 'transparent', color: 'var(--color-text)', cursor: 'pointer',
  };

  return (
    <section className="glass-panel" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
        <span style={label}>Táctica</span>
        <select
          value={activeTacticId ? `custom_${activeTacticId}` : activeAlignment}
          onChange={(e) => onAlignmentChange(e.target.value)}
          className="form-select"
          style={{ width: '100%', minWidth: 0, fontWeight: 600 }}
        >
          <optgroup label="Formaciones predefinidas">
            {Object.keys(ALIGNMENTS_LABELS).map(key => (
              <option key={key} value={key}>{ALIGNMENTS_LABELS[key]}</option>
            ))}
          </optgroup>
          {customTactics.length > 0 && (
            <optgroup label="Tácticas guardadas">
              {customTactics.map(t => (
                <option key={t.id} value={`custom_${t.id}`}>{t.name}</option>
              ))}
            </optgroup>
          )}
        </select>
      </label>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {activeTacticId && onUpdateActiveTactic && (
          <button type="button" onClick={onUpdateActiveTactic} className="btn-neon btn-sm"
            title="Guardar cambios de alineación, posiciones y notas en la base de datos">
            Actualizar táctica
          </button>
        )}
        {onSaveTactic && (
          <button type="button" onClick={onSaveTactic} className="btn-outline btn-sm">
            {activeTacticId ? 'Guardar como nueva' : 'Guardar táctica'}
          </button>
        )}
        <div ref={autoAssignRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={autoAssignLoading}
            aria-expanded={showDropdown}
            className="btn-outline btn-sm"
            style={{ cursor: autoAssignLoading ? 'wait' : 'pointer', opacity: autoAssignLoading ? 0.7 : 1 }}
          >
            {autoAssignLoading ? 'Asignando…' : 'Auto-asignar ▾'}
          </button>
          {showDropdown && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, zIndex: 100, minWidth: '220px', marginTop: '4px',
              background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)', overflow: 'hidden',
            }}>
              {[
                { label: 'Últimos 5 partidos', filter: { limit: 5 } },
                { label: 'Últimos 10 partidos', filter: { limit: 10 } },
                { label: 'Últimos 20 partidos', filter: { limit: 20 } },
                { label: 'Todos los partidos', filter: { limit: null } },
                { label: 'Personalizar…', filter: { mode: 'custom' } },
              ].map((opt, i) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => { setShowDropdown(false); onAutoAssign(opt.filter); }}
                  style={{ ...menuItem, borderTop: i ? '1px solid var(--border-glass)' : 'none' }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={label}>Orientación</span>
          <div className="segmented" role="group" aria-label="Orientación de la cancha">
            {[['horizontal', 'Horizontal'], ['vertical', 'Vertical']].map(([v, l]) => (
              <button key={v} type="button" aria-pressed={pitchOrientation === v}
                className={pitchOrientation === v ? 'is-on' : ''} onClick={() => setPitchOrientation(v)}>{l}</button>
            ))}
          </div>
        </div>
        {setPitchSize && <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={label}>Tamaño</span>
          <div className="segmented" role="group" aria-label="Tamaño de la cancha" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
            {[['small', 'Chico'], ['medium', 'Normal'], ['large', 'Grande']].map(([v, l]) => (
              <button key={v} type="button" aria-pressed={pitchSize === v}
                className={pitchSize === v ? 'is-on' : ''} onClick={() => setPitchSize(v)}>{l}</button>
            ))}
          </div>
        </div>}
      </div>
    </section>
  );
}

export default PitchControls;
