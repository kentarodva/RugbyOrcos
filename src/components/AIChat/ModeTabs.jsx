import React from 'react';
import { CHAT_MODES } from '../../engine/aiConfig';

export function ModeTabs({ chatMode, setChatMode }) {
  return (
    <div className="tabs-navigation" role="tablist" aria-label="Modo del coach">
      {Object.values(CHAT_MODES).map(mode => (
        <button
          key={mode.id}
          onClick={() => setChatMode(mode.id)}
          role="tab"
          aria-selected={chatMode === mode.id}
          className={`tab-btn ${chatMode === mode.id ? 'active' : ''}`}
        >
          {mode.icon} {mode.label}
        </button>
      ))}
    </div>
  );
}
