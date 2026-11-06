import React from 'react';

const money = (n) => `$${Number(n || 0).toLocaleString('es-CO')}`;

export function SummaryCards({ totalIncomes, totalExpenses, netBalance }) {
  return (
    <section className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Balance de caja chica</span>
        <span className="stat-number" style={{ fontSize: '2.25rem', color: netBalance < 0 ? 'var(--color-red)' : 'var(--color-text)' }}>
          {money(netBalance)}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
        {[
          { label: 'Ingresos', value: totalIncomes, color: 'var(--color-primary)' },
          { label: 'Egresos', value: totalExpenses, color: 'var(--color-red)' },
        ].map((k) => (
          <div key={k.label} style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 99, background: k.color }} />
              {k.label}
            </span>
            <span className="stat-number" style={{ fontSize: '1.375rem', overflowWrap: 'anywhere' }}>{money(k.value)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
