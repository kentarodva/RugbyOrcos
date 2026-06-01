import React from 'react';
import { CATEGORY_LABELS } from './constants';

export function FinanceLedger({ teamFinances }) {
  const sorted = [...teamFinances].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'Outfit' }}>?? Historial de Caja (Ledger)</h3>
      {teamFinances.length === 0 ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '15px 0' }}>Sin transacciones registradas.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto', paddingRight: '5px' }}>
          {sorted.map(f => {
            const catLabel = CATEGORY_LABELS[f.category] || '';
            return (
              <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <strong>{f.desc}</strong>
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
                    ?? {f.date} {catLabel && ' | ' + catLabel}
                  </span>
                </div>
                <strong style={{ color: f.type === 'ingreso' ? 'var(--color-primary)' : 'var(--color-red)' }}>
                  {f.type === 'ingreso' ? '+' : '-'}${(f.amount || 0).toLocaleString()}
                </strong>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
