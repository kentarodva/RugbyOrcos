import React from 'react';

export default function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '2px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '3px', marginBottom: '14px', overflow: 'auto' }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
          style={{
            flex: 1, padding: '8px 14px', border: 'none', borderRadius: '8px', cursor: 'pointer',
            background: active === t.id ? 'var(--color-primary)' : 'transparent',
            color: active === t.id ? '#000' : 'var(--text-secondary)',
            fontWeight: active === t.id ? 700 : 500,
            fontSize: '0.82rem', whiteSpace: 'nowrap', transition: 'all 0.2s',
          }}
        >{t.label}</button>
      ))}
    </div>
  );
}
