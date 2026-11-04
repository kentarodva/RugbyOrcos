import React from 'react';
import { Calendar, Radio, Trophy, Clock, Swords } from 'lucide-react';

const TABS = [
  { key: 'agenda', label: 'Agenda y Convocatorias', Icon: Calendar },
  { key: 'envivo', label: 'En Vivo', Icon: Radio, live: true },
  { key: 'fixture', label: 'Campaña y Fixture', Icon: Trophy },
  { key: 'proximos', label: 'Próximos Partidos', Icon: Clock },
  { key: 'rivales', label: 'Rivales & Árbitro', Icon: Swords },
];

function CalendarioTabs({ activeTab, onChange, hasActiveMatch }) {
  return (
    <div style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '14px', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
      <div className="pro-subtabs">
        {TABS.map(tab => {
          const isLive = tab.live && hasActiveMatch;
          const isActive = activeTab === tab.key;
          const Icon = tab.Icon;
          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className={`pro-subtab-btn ${isActive ? 'active' : ''}`}
              style={isLive && !isActive ? { color: 'var(--color-red)', animation: 'pulse 2s infinite' } : undefined}
            >
              {isLive ? (
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: isActive ? '#05080d' : 'var(--color-red)' }} />
              ) : (
                <Icon size={15} />
              )}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default CalendarioTabs;
