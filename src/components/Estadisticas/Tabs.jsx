import React from 'react';

export default function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{ marginBottom: '14px', overflowX: 'auto' }}>
      <div className="pro-subtabs" style={{ width: '100%' }}>
        {tabs.map(t => {
          const isActive = active === t.id;
          const Icon = t.Icon;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className={`pro-subtab-btn ${isActive ? 'active' : ''}`}
              style={{ flex: 1, justifyContent: 'center', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {Icon && <Icon size={14} />}
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
