import React from 'react';
import FutureCard from './FutureCard';

function FutureList({ fixtures, activeTeam, onDelete }) {
  const teamFixtures = fixtures
    .filter(f => f.teamCategory === activeTeam)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (teamFixtures.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        No hay futuros enfrentamientos programados para esta categoria.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      {teamFixtures.map(f => (
        <FutureCard
          key={f.id}
          future={f}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

export default FutureList;
