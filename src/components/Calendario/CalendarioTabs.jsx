import React from 'react';

const TABS = [
  { key: 'agenda', label: 'Agenda y Convocatorias', color: 'var(--color-primary)' },
  { key: 'fixture', label: 'Campana y Fixture', color: 'var(--color-gold)' },
  { key: 'proximos', label: 'Proximos Partidos', color: 'var(--color-blue)' },
  { key: 'rivales', label: 'Rivales & Arbitro', color: 'var(--color-red)' },
];

function CalendarioTabs({ activeTab, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '10px', width: '100%', borderBottom: '1px solid var(--border-glass)', paddingBottom: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
      {TABS.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className="btn-outline"
          style={{
            background: activeTab === tab.key ? tab.color : 'transparent',
            color: activeTab === tab.key ? '#000' : '#fff',
            borderColor: activeTab === tab.key ? tab.color : 'var(--border-glass)',
            fontWeight: activeTab === tab.key ? 800 : 500,
            padding: '8px 16px',
            fontSize: '0.85rem'
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export default CalendarioTabs;
