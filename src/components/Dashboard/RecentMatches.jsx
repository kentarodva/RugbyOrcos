import React from 'react';
import { formatLocalDate } from '../../utils/dates.js';

function RecentMatches({ fixtures, activeTeam }) {
  const teamFixtures = fixtures
    .filter(f => f.teamCategory === activeTeam && new Date(f.date + 'T00:00:00') <= new Date())
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 4);

  return (
    <div className="glass-panel" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'Outfit', color: 'var(--color-gold)' }}>Partidos Recientes</h3>
      {teamFixtures.length === 0 ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '20px 0' }}>
          No se han registrado partidos en esta categoria aun.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {teamFixtures.map(f => {
            const isWinner = f.orcosScore > f.opponentScore;
            const isDraw = f.orcosScore === f.opponentScore;
            return (
              <div key={f.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700 }}>Orcos vs {f.opponent}</h4>
                  <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    {formatLocalDate(new Date(f.date + 'T00:00:00'), { day: 'numeric', month: 'short', year: 'numeric' })}
                    {f.mvp && <span style={{ marginLeft: '8px' }}>MVP: {f.mvp}</span>}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: isWinner ? 'var(--color-primary)' : isDraw ? 'var(--color-gold)' : 'var(--color-red)' }}>
                    {f.orcosScore} - {f.opponentScore}
                  </span>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: isWinner ? 'rgba(0,230,118,0.1)' : isDraw ? 'rgba(255,234,0,0.1)' : 'rgba(255,61,0,0.1)', color: isWinner ? 'var(--color-primary)' : isDraw ? 'var(--color-gold)' : 'var(--color-red)' }}>
                    {isWinner ? 'V' : isDraw ? 'E' : 'D'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default RecentMatches;
