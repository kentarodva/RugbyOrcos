import React from 'react';

const TABS = [
  { key: 'agenda', label: 'Agenda y Convocatorias', color: 'var(--color-primary)' },
  { key: 'envivo', label: 'En Vivo', color: 'var(--color-red)', live: true },
  { key: 'fixture', label: 'Campana y Fixture', color: 'var(--color-gold)' },
  { key: 'proximos', label: 'Proximos Partidos', color: 'var(--color-blue)' },
  { key: 'rivales', label: 'Rivales & Arbitro', color: 'var(--color-red)' },
];

function CalendarioTabs({ activeTab, onChange, hasActiveMatch }) {
  return (
    <div style={{ display: 'flex', gap: '10px', width: '100%', borderBottom: '1px solid var(--border-glass)', paddingBottom: '15px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
      {TABS.map(tab => {
        const isLive = tab.live && hasActiveMatch;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className="btn-outline"
            style={{
              background: activeTab === tab.key ? tab.color : isLive ? tab.color + '20' : 'transparent',
              color: activeTab === tab.key ? '#000' : isLive ? tab.color : '#fff',
              borderColor: activeTab === tab.key ? tab.color : isLive ? tab.color : 'var(--border-glass)',
              fontWeight: activeTab === tab.key || isLive ? 800 : 500,
              padding: '8px 16px',
              fontSize: '0.85rem',
              position: 'relative',
              animation: isLive ? 'pulse 2s infinite' : 'none',
            }}
          >
            {isLive && <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: tab.color, marginRight: '6px', verticalAlign: 'middle' }} />}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export default CalendarioTabs;
