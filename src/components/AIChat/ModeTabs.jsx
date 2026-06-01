import React from 'react';
import { CHAT_MODES } from '../../engine/aiConfig';

export function ModeTabs({ chatMode, setChatMode }) {
  return (
    <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>
      {Object.values(CHAT_MODES).map(mode => (
        <button
          key={mode.id}
          onClick={() => setChatMode(mode.id)}
          className={`tab-btn ${chatMode === mode.id ? 'active' : ''}`}
          style={{ padding: '6px 14px', fontSize: '0.75rem' }}
        >
          {mode.icon} {mode.label}
        </button>
      ))}
    </div>
  );
}
