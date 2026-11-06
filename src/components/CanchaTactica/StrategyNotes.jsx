import React from 'react';

function StrategyNotes({ tacticalNotes, onChange }) {
  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Pizarra de Estrategia</h3>

      <textarea
        className="form-textarea"
        rows="8"
        placeholder="Escribe notas aqui... Ej. Lanzamiento de line-out al primer saltador, presion rapida en patada del Apertura, etc."
        value={tacticalNotes}
        onChange={(e) => onChange(e.target.value)}
        style={{ fontSize: '0.85rem', lineHeight: '1.5', fontFamily: 'monospace' }}
      />

      <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
        Las alineaciones, coordenadas y notas tacticas se guardan automaticamente en tiempo real.
      </p>
    </div>
  );
}

export default StrategyNotes;
