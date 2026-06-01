import React from 'react';

export function SummaryCards({ totalIncomes, totalExpenses, netBalance }) {
  return (
    <div className="glass-panel" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'Outfit' }}>?? Caja Chica & Tercer Tiempo</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
        <div style={{ background: 'var(--bg-dark)', padding: '12px', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--color-primary)', textAlign: 'center' }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Ingresos</span>
          <h4 style={{ color: 'var(--color-primary)', fontSize: '1.1rem', fontWeight: 800, marginTop: '4px' }}>${totalIncomes.toLocaleString()}</h4>
        </div>
        <div style={{ background: 'var(--bg-dark)', padding: '12px', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--color-red)', textAlign: 'center' }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Egresos</span>
          <h4 style={{ color: 'var(--color-red)', fontSize: '1.1rem', fontWeight: 800, marginTop: '4px' }}>${totalExpenses.toLocaleString()}</h4>
        </div>
        <div style={{ background: 'var(--bg-dark)', padding: '12px', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--color-primary)', textAlign: 'center' }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Balance</span>
          <h4 style={{ color: netBalance >= 0 ? 'var(--color-primary)' : 'var(--color-red)', fontSize: '1.1rem', fontWeight: 800, marginTop: '4px' }}>${netBalance.toLocaleString()}</h4>
        </div>
      </div>
    </div>
  );
}
