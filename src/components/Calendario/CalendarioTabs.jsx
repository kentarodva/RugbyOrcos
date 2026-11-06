import React from 'react';
import { Calendar, Radio, Trophy, Clock, Swords, Mail } from 'lucide-react';

const TABS = [
  { key: 'agenda', label: 'Agenda y Convocatorias', Icon: Calendar },
  { key: 'envivo', label: 'En Vivo', Icon: Radio, live: true },
  { key: 'fixture', label: 'Campaña y Fixture', Icon: Trophy },
  { key: 'proximos', label: 'Próximos Partidos', Icon: Clock },
  { key: 'rivales', label: 'Rivales & Árbitro', Icon: Swords },
  { key: 'invitaciones', label: 'Invitaciones', Icon: Mail },
];

function CalendarioTabs({ activeTab, onChange, hasActiveMatch }) {
  return (
    <div style={{ marginBottom: '16px', width: '100%', minWidth: 0 }}>
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
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: isActive ? '#06210F' : 'var(--color-red)' }} />
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
