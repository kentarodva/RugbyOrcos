import React from 'react';

function SeasonRecords({ fixtures, activeTeam }) {
  const teamFixes = fixtures.filter(f => f.teamCategory === activeTeam);
  const wins = teamFixes.filter(f => f.orcosScore > f.opponentScore).length;
  const draws = teamFixes.filter(f => f.orcosScore === f.opponentScore).length;
  const losses = teamFixes.filter(f => f.orcosScore < f.opponentScore).length;
  const totalTries = teamFixes.reduce((sum, f) => sum + (f.tries || 0), 0);

  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '12px' }}>Record de Campana de la Categoria</h4>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center' }}>
          <div style={{ background: 'rgba(0, 230, 118, 0.02)', border: '1px solid rgba(0, 230, 118, 0.1)', padding: '10px 5px', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', display: 'block' }}>VICTORIAS</span>
            <strong style={{ fontSize: '1.2rem', color: 'var(--color-primary)' }}>{wins}</strong>
          </div>
          <div style={{ background: 'rgba(255, 234, 0, 0.02)', border: '1px solid rgba(255, 234, 0, 0.1)', padding: '10px 5px', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', display: 'block' }}>EMPATES</span>
            <strong style={{ fontSize: '1.2rem', color: 'var(--color-gold)' }}>{draws}</strong>
          </div>
          <div style={{ background: 'rgba(255, 61, 0, 0.02)', border: '1px solid rgba(255, 61, 0, 0.1)', padding: '10px 5px', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', display: 'block' }}>DERROTAS</span>
            <strong style={{ fontSize: '1.2rem', color: 'var(--color-red)' }}>{losses}</strong>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', marginTop: '5px' }}>
          <span style={{ color: 'var(--color-text-muted)' }}>Total Tries Conquistados:</span>
          <strong style={{ color: 'var(--color-primary)' }}>{totalTries} Tries</strong>
        </div>
      </div>
    </div>
  );
}

export default SeasonRecords;
