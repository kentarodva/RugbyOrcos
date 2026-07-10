import React from 'react';
import { Icon } from './icons';

export function ChatHeader({ configured, activeProvInfo, settingsReady, teamFixtures, analyzingMatch, onAnalyze, onClear, messagesCount }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
      <div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif' }} className="neon-text-primary">
          <Icon name="ai" size={22} /> Chat Tactico
        </h2>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          {!settingsReady
            ? <><Icon name="loading" size={14} /> Cargando configuración IA...</>
            : configured
            ? (activeProvInfo
              ? activeProvInfo.icon + ' ' + activeProvInfo.name + ' \u00B7 ' + activeProvInfo.desc
              : <><Icon name="ai" size={14} /> Auto &middot; Multi-proveedor con fallback</>)
            : <><Icon name="warning" size={14} /> Sin proveedores configurados</>}
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
            {analyzingMatch ? <><Icon name="loading" size={14} className="ai-icon-spin" /> Analizando...</> : <><Icon name="chart" size={14} /> Analizar Partido</>}
          </button>
        )}
        {messagesCount > 0 && (
          <button onClick={onClear} className="btn-outline" style={{ padding: '5px 12px', fontSize: '0.7rem' }}>
            <Icon name="trash" size={14} /> Limpiar
          </button>
        )}
      </div>
    </div>
  );
}
