import React from 'react';
import { FixtureMatch } from './FixtureMatch';

export function FixtureList({ matches, activeTournament, onGenerate, onUpdateMatch }) {
  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <button onClick={onGenerate} className="btn-outline" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>Generar Fixture</button>
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', alignSelf: 'center' }}>
          {matches.length} partidos � {activeTournament.name}
        </span>
      </div>
      {matches.map(m => (
        <FixtureMatch key={m.id} match={m} onUpdate={onUpdateMatch} />
      ))}
    </div>
  );
}
