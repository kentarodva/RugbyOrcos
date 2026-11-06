import React from 'react';

function StrategyNotes({ tacticalNotes, onChange }) {
  return (
    <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <h3 className="section-title">Notas tácticas</h3>

      <textarea
        className="form-textarea"
        rows="5"
        placeholder="Ej.: line-out al primer saltador, presión rápida en la patada del apertura…"
        value={tacticalNotes}
        onChange={(e) => onChange(e.target.value)}
        style={{ fontSize: '0.9375rem', lineHeight: '1.5' }}
      />

      <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
        La alineación, las posiciones y las notas se guardan solas.
      </p>
    </div>
  );
}

export default StrategyNotes;
