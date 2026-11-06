import React from 'react';

/** Neutral metric card: label with icon, big number, optional caption. `color` is kept for API compatibility. */
export default function KPI({ value, label, icon, sub }) {
  return (
    <div className="glass-panel" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
        {icon && <span aria-hidden="true" style={{ display: 'inline-flex', color: 'var(--color-text-subtle)' }}>{icon}</span>}
        {label}
      </span>
      <span className="stat-number" style={{ fontSize: '1.75rem', overflowWrap: 'anywhere' }}>{value}</span>
      {sub && <span style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>{sub}</span>}
    </div>
  );
}
