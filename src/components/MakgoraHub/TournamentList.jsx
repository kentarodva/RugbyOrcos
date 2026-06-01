import React from 'react';
import { TournamentCard } from './TournamentCard';
import { CreateTournamentForm } from './CreateTournamentForm';

export function TournamentList({ tournaments, showCreate, teamName, onCreateToggle, onCreate, onSelect }) {
  return (
    <div>
      <div style={{ marginBottom: '15px' }}>
        <button onClick={onCreateToggle} className="btn-neon" style={{ padding: '10px 20px', fontSize: '0.85rem' }}>
          + Nuevo Torneo MakGora
        </button>
      </div>

      {showCreate && <CreateTournamentForm onCreate={onCreate} />}

      {tournaments.map(t => (
        <TournamentCard
          key={t.id}
          tournament={t}
          teamName={teamName}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
