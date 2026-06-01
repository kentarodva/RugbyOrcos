import React from 'react';
import { WORKOUTS, CATEGORY_LABELS, CATEGORY_ICONS, CATEGORY_COLORS } from './constants';

function CatalogTab({ activeCategory, onCategoryChange }) {
  const categories = ['forwards', 'backs', 'captain', 'coach', 'general'];
  const borderColor = CATEGORY_COLORS[activeCategory] || 'var(--color-primary)';

  return (
    <div className="animated-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', flexWrap: 'wrap' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className={`tab-btn ${activeCategory === cat ? 'active' : ''}`}
          >
            {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>
        {WORKOUTS[activeCategory]?.map((w, index) => (
          <div
            key={index}
            className="glass-panel animated-slide"
            style={{
              padding: '25px',
              borderLeft: `4px solid ${borderColor}`
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '15px' }}>
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'Outfit' }}>{w.title}</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  Posiciones: <strong>{w.focus}</strong>
                </p>
              </div>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: '1.5', marginBottom: '15px', background: 'var(--bg-dark)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
              {w.description}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase' }}>Rutina de Campo:</span>

              <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '15px', fontSize: '0.8rem', color: 'var(--color-text)' }}>
                {w.drills.map((drill, dIndex) => (
                  <li key={dIndex} style={{ lineHeight: '1.4' }}>
                    {drill}
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              <span>⏱️ Duración: <strong>{w.duration}</strong></span>
              <span>Dificultad: <strong style={{ color: 'var(--color-gold)' }}>{w.difficulty}</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CatalogTab;
