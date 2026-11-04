import React from 'react';
import { TournamentCard } from './TournamentCard';
import { CreateTournamentForm } from './CreateTournamentForm';

export function TournamentList({ tournaments, showCreate, teamName, onCreateToggle, onCreate, onSelect, onEdit, teams }) {
  return (
    <div>
      <div style={{ marginBottom: '15px' }}>
        <button onClick={onCreateToggle} className="btn-neon" style={{ padding: '10px 20px', fontSize: '0.85rem' }}>
          + Nuevo Torneo MakGora
        </button>
      </div>

      {showCreate && <CreateTournamentForm teams={teams || []} onCreate={onCreate} onCancel={onCreateToggle} />}

      {tournaments.map(t => (
          <TournamentCard
          key={t.id}
          tournament={t}
          teamName={teamName}
          onSelect={onSelect}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}
