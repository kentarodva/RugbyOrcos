import React from 'react';

const SPEEDS = [['0.5x', 'Lenta'], ['0.75x', 'Normal'], ['1x', 'Rápida'], ['1.5x', 'Muy rápida']];

/** Controls + explanation for the play on the pitch. Lives right under the pitch. */
function PhaseStrip({ title, phases, activeIndex, isPlaying, onTogglePlay, onPrev, onNext, onSelect, speed, onSpeed, onExit }) {
  if (!phases.length) return null;
  const phase = phases[activeIndex] || phases[0];
  const many = phases.length > 1;
  const cleanTitle = String(phase.title || '').replace(/^Fase \d+:\s*/, '');

  return (
    <section aria-label="Fases de la jugada" className="glass-panel" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ flex: 1, minWidth: 0, fontSize: '0.8125rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {title}
        </span>
        <button type="button" className="btn-outline btn-sm" onClick={onExit}>Salir</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {many && <button type="button" className="btn-outline btn-sm" onClick={onPrev} aria-label="Fase anterior" style={{ minWidth: 44 }}>‹</button>}
        {many && (
          <button type="button" className={isPlaying ? 'btn-outline btn-sm' : 'btn-neon btn-sm'} onClick={onTogglePlay} style={{ minWidth: 92 }}>
            {isPlaying ? 'Pausa' : '▶ Ver'}
          </button>
        )}
        {many && <button type="button" className="btn-outline btn-sm" onClick={onNext} aria-label="Fase siguiente" style={{ minWidth: 44 }}>›</button>}
        <div role="group" aria-label="Ir a la fase" style={{ display: 'flex', gap: '4px', overflowX: 'auto', flex: 1, minWidth: 0, scrollbarWidth: 'none' }}>
          {phases.map((_, i) => (
            <button key={i} type="button" onClick={() => onSelect(i)} aria-current={i === activeIndex ? 'step' : undefined}
              aria-label={`Fase ${i + 1}`}
              style={{
                flexShrink: 0, width: 34, height: 34, borderRadius: 99, font: 'inherit', fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer',
                border: `1px solid ${i === activeIndex ? 'var(--color-primary)' : 'var(--border-glass)'}`,
                background: i === activeIndex ? 'var(--color-primary)' : 'transparent',
                color: i === activeIndex ? '#08110B' : 'var(--color-text-soft)',
              }}>{i + 1}</button>
          ))}
        </div>
      </div>

      <div>
        <strong style={{ display: 'block', fontSize: '0.9375rem' }}>
          Fase {activeIndex + 1} de {phases.length}{cleanTitle ? ` · ${cleanTitle}` : ''}
        </strong>
        {phase.description && (
          <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--color-text-soft)', lineHeight: 1.5 }}>{phase.description}</p>
        )}
      </div>

      {many && (
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
          Velocidad
          <select className="form-select" value={speed} onChange={e => onSpeed(e.target.value)} style={{ width: 'auto', minHeight: 36, padding: '4px 10px', fontSize: '0.8125rem' }}>
            {SPEEDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
      )}
    </section>
  );
}

export default PhaseStrip;
