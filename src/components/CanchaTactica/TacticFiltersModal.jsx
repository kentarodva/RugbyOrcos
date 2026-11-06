import React, { useState } from 'react';

function TacticFiltersModal({ onAssign, onClose }) {
  const [mode, setMode] = useState('last_10');
  const [limit, setLimit] = useState(10);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const handleAssign = () => {
    let filters = {};

    switch (mode) {
      case 'last_5':
        filters = { limit: 5 };
        break;
      case 'last_10':
        filters = { limit: 10 };
        break;
      case 'last_20':
        filters = { limit: 20 };
        break;
      case 'all':
        filters = { limit: null };
        break;
      case 'custom':
        filters = {};
        if (limit > 0) filters.limit = limit;
        if (dateFrom) filters.dateFrom = dateFrom;
        if (dateTo) filters.dateTo = dateTo;
        break;
    }

    onAssign(filters);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel animated-slide" style={{ maxWidth: '380px' }}>
        <h3 className="neon-text-primary" style={{ marginBottom: '15px', fontFamily: 'var(--font-display)' }}>
          Auto-asignar Jugadores
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
          Selecciona qué historial de partidos usar para calcular la mejor alineación.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { value: 'last_5', label: 'Últimos 5 partidos' },
            { value: 'last_10', label: 'Últimos 10 partidos' },
            { value: 'last_20', label: 'Últimos 20 partidos' },
            { value: 'all', label: 'Todos los partidos' },
            { value: 'custom', label: 'Personalizar...' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setMode(opt.value)}
              className="btn-outline"
              style={{
                justifyContent: 'flex-start',
                padding: '10px 14px',
                fontSize: '0.85rem',
                borderColor: mode === opt.value ? 'var(--color-primary)' : 'var(--border-glass)',
                background: mode === opt.value ? 'rgba(46, 229, 122, 0.1)' : 'transparent',
                color: mode === opt.value ? 'var(--color-primary)' : 'var(--color-text)',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {mode === 'custom' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
                Cantidad de partidos
              </label>
              <input
                type="number"
                value={limit || ''}
                onChange={(e) => setLimit(Number(e.target.value) || 0)}
                min={1}
                className="form-input"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--color-text)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
                Desde
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="form-input"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--color-text)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
                Hasta
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="form-input"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--color-text)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                }}
              />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button onClick={onClose} className="btn-outline" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
            Cancelar
          </button>
          <button
            onClick={handleAssign}
            className="btn-neon"
            style={{
              padding: '8px 16px',
              fontSize: '0.85rem',
              background: 'var(--color-primary)',
              color: '#111412',
              fontWeight: 800,
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
            }}
          >
            Asignar
          </button>
        </div>
      </div>
    </div>
  );
}

export default TacticFiltersModal;
