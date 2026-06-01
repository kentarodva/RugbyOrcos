import React from 'react';

export function ChatHeader({ configured, activeProvInfo, teamFixtures, analyzingMatch, onAnalyze, onClear, messagesCount }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
      <div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif' }} className="neon-text-primary">
          ?? Chat Tactico
        </h2>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          {configured
            ? (activeProvInfo
              ? activeProvInfo.icon + ' ' + activeProvInfo.name + ' � ' + activeProvInfo.desc
              : '?? Auto � Multi-proveedor con fallback')
            : '?? Sin proveedores configurados'}
        </p>
      </div>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {teamFixtures.length > 0 && (
          <button
            onClick={onAnalyze}
            disabled={analyzingMatch || !configured}
            className="btn-outline"
            style={{ padding: '5px 12px', fontSize: '0.7rem' }}
          >
            {analyzingMatch ? '? Analizando...' : '?? Analizar Partido'}
          </button>
        )}
        {messagesCount > 0 && (
          <button onClick={onClear} className="btn-outline" style={{ padding: '5px 12px', fontSize: '0.7rem' }}>
            ??? Limpiar
          </button>
        )}
      </div>
    </div>
  );
}
