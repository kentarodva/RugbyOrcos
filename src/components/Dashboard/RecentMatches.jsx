import React from 'react';
import { formatLocalDate } from '../../utils/dates.js';

function RecentMatches({ fixtures, activeTeam }) {
  const teamFixtures = fixtures
    .filter(f => f.teamCategory === activeTeam && new Date(f.date + 'T00:00:00') <= new Date())
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 4);

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <h3 className="section-title">Partidos recientes</h3>
      <div className="glass-panel">
        {teamFixtures.length === 0 ? (
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', padding: '14px 16px' }}>
            Aún no hay partidos registrados.
          </p>
        ) : (
          teamFixtures.map((f, i) => {
            const result = f.orcosScore > f.opponentScore ? 'V' : f.orcosScore === f.opponentScore ? 'E' : 'D';
            const color = result === 'V' ? 'var(--color-primary)' : result === 'E' ? 'var(--color-gold)' : 'var(--color-red)';
            return (
              <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', padding: '12px 16px', borderTop: i ? '1px solid var(--border-glass)' : 'none' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 600 }}>vs {f.opponent}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                    {formatLocalDate(new Date(f.date + 'T00:00:00'), { day: 'numeric', month: 'short', year: 'numeric' })}
                    {f.mvp && ` · MVP: ${f.mvp}`}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
                  <span className="stat-number" style={{ fontSize: '1.375rem' }}>{f.orcosScore}–{f.opponentScore}</span>
                  <span aria-label={result === 'V' ? 'Victoria' : result === 'E' ? 'Empate' : 'Derrota'} style={{ width: 24, height: 24, borderRadius: 8, display: 'grid', placeItems: 'center', fontSize: '0.75rem', fontWeight: 700, color, background: `color-mix(in srgb, ${color} 14%, transparent)` }}>
                    {result}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

export default RecentMatches;
