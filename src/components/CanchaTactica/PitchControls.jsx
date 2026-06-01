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

  return (
    <>
      <div className="glass-panel" style={{
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '15px',
        background: 'rgba(15, 22, 36, 0.4)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-glass)',
        flexWrap: 'wrap',
        marginBottom: '5px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 auto' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-gold)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Tactica:
          </span>
          <select
            value={activeTacticId ? `custom_${activeTacticId}` : activeAlignment}
            onChange={(e) => onAlignmentChange(e.target.value)}
            className="form-select"
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--color-primary)',
              color: 'var(--color-primary)',
              fontWeight: '700',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              minWidth: '200px',
            }}
          >
            <optgroup label="Formaciones predefinidas">
              {Object.keys(ALIGNMENTS_LABELS).map(key => (
                <option key={key} value={key}>
                  {ALIGNMENTS_LABELS[key]}
                </option>
              ))}
            </optgroup>
            {customTactics.length > 0 && (
              <optgroup label="🌟 Tácticas guardadas">
                {customTactics.map(t => (
                  <option key={t.id} value={`custom_${t.id}`}>
                    {t.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Guardar táctica */}
          {onSaveTactic && (
            <button
              onClick={onSaveTactic}
              className="btn-outline"
              style={{
                padding: '6px 12px',
                fontSize: '0.78rem',
                fontWeight: '700',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                borderColor: 'var(--color-gold)',
                color: 'var(--color-gold)',
                background: 'transparent',
              }}
            >
              💾 Guardar
            </button>
          )}

          {/* Auto-asignar dropdown */}
          <div ref={autoAssignRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              disabled={autoAssignLoading}
              className="btn-outline"
              style={{
                padding: '6px 12px',
                fontSize: '0.78rem',
                fontWeight: '700',
                borderRadius: 'var(--radius-sm)',
                cursor: autoAssignLoading ? 'wait' : 'pointer',
                borderColor: 'var(--color-primary)',
                color: 'var(--color-primary)',
                background: autoAssignLoading ? 'rgba(0, 230, 118, 0.1)' : 'transparent',
                opacity: autoAssignLoading ? 0.7 : 1,
              }}
            >
              {autoAssignLoading ? '⏳ Asignando...' : '🔄 Auto-asignar ▾'}
            </button>

            {showDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                zIndex: 100,
                minWidth: '220px',
                marginTop: '4px',
                background: 'var(--bg-surface-solid)',
                border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-sm)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                overflow: 'hidden',
              }}>
                {[
                  { label: 'Últimos 5 partidos', filter: { limit: 5 } },
                  { label: 'Últimos 10 partidos', filter: { limit: 10 } },
                  { label: 'Últimos 20 partidos', filter: { limit: 20 } },
                  { label: 'Todos los partidos', filter: { limit: null } },
                ].map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => { setShowDropdown(false); onAutoAssign(opt.filter); }}
                    className="btn-outline"
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: '0.82rem',
                      textAlign: 'left',
                      border: 'none',
                      borderBottom: i < 3 ? '1px solid var(--border-glass)' : 'none',
                      borderRadius: 0,
                      background: 'transparent',
                      color: 'var(--color-text)',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,230,118,0.08)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {opt.label}
                  </button>
                ))}
                <div style={{ borderTop: '1px solid var(--border-glass)' }}>
                  <button
                    onClick={() => { setShowDropdown(false); onAutoAssign({ mode: 'custom' }); }}
                    className="btn-outline"
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: '0.82rem',
                      textAlign: 'left',
                      border: 'none',
                      borderRadius: 0,
                      background: 'transparent',
                      color: 'var(--color-text)',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,230,118,0.08)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    Personalizar...
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* VISTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-gold)', letterSpacing: '0.5px' }}>VISTA:</span>
            <button
              onClick={() => setPitchOrientation('horizontal')}
              className="btn-outline"
              style={{
                padding: '4px 10px',
                fontSize: '0.72rem',
                fontWeight: '700',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                borderColor: pitchOrientation === 'horizontal' ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)',
                background: pitchOrientation === 'horizontal' ? 'rgba(0, 230, 118, 0.15)' : 'transparent',
                color: pitchOrientation === 'horizontal' ? 'var(--color-primary)' : 'rgba(255,255,255,0.6)',
                transition: 'all 0.2s'
              }}
            >
              ↔️ Horizontal
            </button>
            <button
              onClick={() => setPitchOrientation('vertical')}
              className="btn-outline"
              style={{
                padding: '4px 10px',
                fontSize: '0.72rem',
                fontWeight: '700',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                borderColor: pitchOrientation === 'vertical' ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)',
                background: pitchOrientation === 'vertical' ? 'rgba(0, 230, 118, 0.15)' : 'transparent',
                color: pitchOrientation === 'vertical' ? 'var(--color-primary)' : 'rgba(255,255,255,0.6)',
                transition: 'all 0.2s'
              }}
            >
              ↕️ Vertical
            </button>
          </div>

          {/* TAMAÑO */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-gold)', letterSpacing: '0.5px' }}>TAMAÑO:</span>
            {['small', 'medium', 'large'].map(sz => (
              <button
                key={sz}
                onClick={() => setPitchSize(sz)}
                className="btn-outline"
                style={{
                  padding: '4px 8px',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  borderRadius: 'var(--radius-sm)',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  borderColor: pitchSize === sz ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)',
                  background: pitchSize === sz ? 'rgba(0, 230, 118, 0.15)' : 'transparent',
                  color: pitchSize === sz ? 'var(--color-primary)' : 'rgba(255,255,255,0.6)',
                  transition: 'all 0.2s'
                }}
              >
                {sz === 'small' ? 'Chico' : sz === 'medium' ? 'Normal' : 'Grande'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default PitchControls;
