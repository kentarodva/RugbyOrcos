import React from 'react';

/** Squad status at a glance: 2×2 on phones, 4 across on wide screens. */
function MetricsCards({ totalOrcos, activos, lesionados, suspendidos, inactivos }) {
  const readyPct = totalOrcos > 0 ? Math.round((activos / totalOrcos) * 100) : 0;
  const unavailable = suspendidos + inactivos;

  const cards = [
    { label: 'Plantilla', value: totalOrcos, sub: 'Guerreros en esta vista' },
    { label: 'Disponibles', value: `${readyPct}%`, sub: `${activos} de ${totalOrcos}`, color: 'var(--color-primary)' },
    {
      label: 'Lesionados',
      value: lesionados,
      sub: lesionados > 0 ? 'En enfermería o protocolo' : 'Enfermería vacía',
      color: lesionados > 0 ? 'var(--color-red)' : undefined,
    },
    {
      label: 'No disponibles',
      value: unavailable,
      sub: `${suspendidos} sancionados · ${inactivos} inactivos`,
      color: unavailable > 0 ? 'var(--color-gold)' : undefined,
    },
  ];

  return (
    <div className="metrics-grid">
      {cards.map((c) => (
        <div key={c.label} className="metric-card-v5">
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>{c.label}</span>
          <span className="stat-number" style={{ fontSize: '2.25rem', color: c.color || 'var(--color-text)' }}>
            {c.value}
          </span>
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{c.sub}</span>
        </div>
      ))}
    </div>
  );
}

export default MetricsCards;
