import React from 'react';
import { Calendar, Trophy, Swords } from 'lucide-react';

const TABS = [
  { key: 'agenda', label: 'Calendario', Icon: Calendar },
  { key: 'partidos', label: 'Partidos', Icon: Trophy },
  { key: 'rivales', label: 'Rivales', Icon: Swords },
];

/**
 * Agenda tabs. "En Vivo" is not a permanent tab: it only shows up while a match
 * is being played (or while the live screen is open to start one).
 */
function CalendarioTabs({ activeTab, onChange, hasActiveMatch }) {
  const showLive = hasActiveMatch || activeTab === 'envivo';
  return (
    <div style={{ width: '100%', minWidth: 0 }}>
      <div className="pro-subtabs">
        {showLive && (
          <button
            onClick={() => onChange('envivo')}
            className={`pro-subtab-btn ${activeTab === 'envivo' ? 'active' : ''}`}
            style={activeTab !== 'envivo' ? { color: 'var(--color-red)' } : undefined}
          >
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: activeTab === 'envivo' ? '#06210F' : 'var(--color-red)' }} />
            <span>En vivo</span>
          </button>
        )}
        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`pro-subtab-btn ${activeTab === key ? 'active' : ''}`}
          >
            <Icon size={15} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default CalendarioTabs;
