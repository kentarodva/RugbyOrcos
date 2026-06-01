import React from 'react';
import FixtureCard from './FixtureCard';

function FixtureList({ fixtures, activeTeam, onDelete, onDetail }) {
  const teamFixtures = fixtures
    .filter(f => f.teamCategory === activeTeam)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (teamFixtures.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        Aun no se han disputado batallas en esta campana. Registra el primer resultado!
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      {teamFixtures.map(f => (
        <FixtureCard
          key={f.id}
          fixture={f}
          onDelete={onDelete}
          onDetail={onDetail}
        />
      ))}
    </div>
  );
}

export default FixtureList;
