import React from 'react';
import FixtureCard from './FixtureCard';

function FixtureList({ fixtures, onDelete, onDetail, onEdit, onStartMatch, onSquad, hasActiveMatch }) {
  const sorted = [...fixtures].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (sorted.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        Aun no se han disputado batallas en esta campana. Registra el primer resultado!
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      {sorted.map(f => (
        <FixtureCard
          key={f.id}
          fixture={f}
          onDelete={onDelete}
          onDetail={onDetail}
          onEdit={onEdit}
          onStartMatch={onStartMatch}
          onSquad={onSquad}
          hasActiveMatch={hasActiveMatch}
        />
      ))}
    </div>
  );
}

export default FixtureList;
