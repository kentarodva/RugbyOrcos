import React from 'react';

export default function KPI({ value, label, icon, color, sub }) {
  return (
    <div className="glass-panel" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{
        width: '42px', height: '42px', borderRadius: '10px',
        background: `rgba(${color === '#00e676' ? '0,230,118' : color === '#ff5252' ? '255,82,82' : color === '#448aff' ? '68,130,255' : '255,215,64'}, 0.15)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.3rem',
      }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{value}</div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{sub}</div>}
      </div>
    </div>
  );
}
