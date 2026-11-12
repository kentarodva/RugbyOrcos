import React from 'react';

/** Season record (W/D/L) and tries for the active category. */
function SeasonRecords({ fixtures }) {
  const wins = fixtures.filter(f => f.orcosScore > f.opponentScore).length;
  const draws = fixtures.filter(f => f.orcosScore === f.opponentScore).length;
  const losses = fixtures.filter(f => f.orcosScore < f.opponentScore).length;
  const totalTries = fixtures.reduce((sum, f) => sum + (f.tries || 0), 0);

  const cells = [
    { label: 'Victorias', value: wins, dot: 'var(--color-primary)' },
    { label: 'Empates', value: draws, dot: 'var(--color-gold)' },
    { label: 'Derrotas', value: losses, dot: 'var(--color-red)' },
  ];

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <h3 className="section-title">Récord de la temporada</h3>
      <div className="glass-panel" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px' }}>
          {cells.map((c) => (
            <div key={c.label} style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '10px 12px', minWidth: 0 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 99, background: c.dot, flexShrink: 0 }} />
                {c.label}
              </span>
              <span className="stat-number" style={{ fontSize: '1.625rem', display: 'block', marginTop: '4px' }}>{c.value}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
          <span style={{ color: 'var(--color-text-muted)' }}>Tries en la temporada</span>
          <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{totalTries}</strong>
        </div>
      </div>
    </section>
  );
}

export default SeasonRecords;
