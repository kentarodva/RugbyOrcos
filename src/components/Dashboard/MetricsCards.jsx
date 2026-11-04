import React from 'react';
import { Shield, Swords, HeartPulse, Scale } from 'lucide-react';

function MetricsCards({ totalOrcos, activos, lesionados, suspendidos, inactivos }) {
  const safeTotal = Math.max(totalOrcos, 1);
  const readyPct = totalOrcos > 0 ? Math.round((activos / safeTotal) * 100) : 0;
  const injuredPct = totalOrcos > 0 ? Math.round((lesionados / safeTotal) * 100) : 0;
  const unavailableCount = suspendidos + inactivos;
  const unavailablePct = totalOrcos > 0 ? Math.round((unavailableCount / safeTotal) * 100) : 0;

  const cards = [
    {
      label: 'Guerreros Totales',
      value: totalOrcos,
      sub: 'Plantilla registrada en esta vista',
      pct: 100,
      color: 'var(--color-blue)',
      bgGlow: 'rgba(0, 176, 255, 0.12)',
      borderColor: 'rgba(0, 176, 255, 0.28)',
      icon: Shield,
    },
    {
      label: 'Listos para Combate',
      value: activos,
      sub: `${readyPct}% de disponibilidad activa`,
      pct: readyPct,
      color: 'var(--color-primary)',
      bgGlow: 'rgba(0, 230, 118, 0.12)',
      borderColor: 'rgba(0, 230, 118, 0.3)',
      icon: Swords,
    },
    {
      label: 'Bajas por Lesión',
      value: lesionados,
      sub: lesionados > 0 ? `${injuredPct}% en enfermería / protocolo` : 'Sin guerreros en enfermería',
      pct: injuredPct,
      color: 'var(--color-red)',
      bgGlow: 'rgba(255, 61, 0, 0.12)',
      borderColor: 'rgba(255, 61, 0, 0.3)',
      icon: HeartPulse,
    },
    {
      label: 'Sanciones / Inactivos',
      value: unavailableCount,
      sub: `${suspendidos} sancionados · ${inactivos} inactivos`,
      pct: unavailablePct,
      color: 'var(--color-gold)',
      bgGlow: 'rgba(255, 179, 0, 0.12)',
      borderColor: 'rgba(255, 179, 0, 0.3)',
      icon: Scale,
    },
  ];

  return (
    <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))' }}>
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.label}
            className="metric-card-v5"
            style={{ borderLeft: `3px solid ${c.color}` }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div>
                <p
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--color-text-muted)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                  }}
                >
                  {c.label}
                </p>
                <h3
                  style={{
                    fontSize: '2.15rem',
                    fontWeight: 900,
                    fontFamily: 'Outfit',
                    color: c.color,
                    lineHeight: 1.15,
                    marginTop: '4px',
                  }}
                >
                  {c.value}
                </h3>
              </div>

              <div
                className="metric-icon-box"
                style={{
                  background: c.bgGlow,
                  border: `1px solid ${c.borderColor}`,
                  color: c.color,
                }}
              >
                <Icon size={22} />
              </div>
            </div>

            <div>
              <div
                style={{
                  width: '100%',
                  height: '5px',
                  borderRadius: '4px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  overflow: 'hidden',
                  marginBottom: '6px',
                }}
              >
                <div
                  style={{
                    width: `${Math.min(100, Math.max(4, c.pct))}%`,
                    height: '100%',
                    background: c.color,
                    borderRadius: '4px',
                    transition: 'width 0.5s ease-out',
                  }}
                />
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                {c.sub}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default MetricsCards;
