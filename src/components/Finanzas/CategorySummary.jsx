import React from 'react';
import { CATEGORY_LABELS } from './constants';

const CATEGORIES = ['mensualidad', 'eventualidad', 'implementos', 'tercer_tiempo', 'transporte', 'general', 'reunion', 'hotel', 'prestamo', 'alimentacion'];

/** Net total per category; only categories with movements are listed. */
export function CategorySummary({ teamFinances }) {
  const rows = CATEGORIES.map((cat) => {
    const items = teamFinances.filter((f) => (f.category || 'general') === cat);
    const total = items.reduce((sum, f) => sum + Number(f.amount || 0) * (f.type === 'egreso' ? -1 : 1), 0);
    return { cat, count: items.length, total };
  }).filter((r) => r.count > 0);

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <h3 className="section-title">Por categoría</h3>
      <div className="glass-panel">
        {rows.length === 0 ? (
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', padding: '14px 16px', margin: 0 }}>
            Aún no hay movimientos para resumir.
          </p>
        ) : (
          rows.map((r, i) => (
            <div key={r.cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', padding: '12px 16px', borderTop: i ? '1px solid var(--border-glass)' : 'none', fontSize: '0.875rem' }}>
              <span>
                {CATEGORY_LABELS[r.cat] || r.cat}
                <span style={{ color: 'var(--color-text-subtle)', marginLeft: '6px', fontSize: '0.8125rem' }}>{r.count} mov.</span>
              </span>
              <strong style={{ fontVariantNumeric: 'tabular-nums', color: r.total < 0 ? 'var(--color-red)' : 'var(--color-text)' }}>
                ${r.total.toLocaleString('es-CO')}
              </strong>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
