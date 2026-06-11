import React from 'react';

export function CategorySummary({ teamFinances }) {
  const categories = ['mensualidad', 'eventualidad', 'implementos', 'tercer_tiempo', 'transporte', 'general', 'reunion', 'hotel', 'prestamo', 'alimentacion'];

  return (
    <div className="glass-panel" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'Outfit' }}>📊 Resumen por Categoría</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {categories.map(cat => {
          const catTotal = teamFinances
            .filter(f => (f.category || 'general') === cat)
            .reduce((sum, f) => sum + Number(f.amount || 0) * (f.type === 'egreso' ? -1 : 1), 0);
          return (
            <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
              <span style={{ textTransform: 'capitalize' }}>{cat.replace('_', ' ')}</span>
              <strong style={{ color: catTotal >= 0 ? 'var(--color-primary)' : 'var(--color-red)' }}>
                ${catTotal.toLocaleString()}
              </strong>
            </div>
          );
        })}
      </div>
    </div>
  );
}
