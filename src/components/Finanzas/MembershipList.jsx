import React from 'react';
import { MembershipCard } from './MembershipCard';

export function MembershipList({ teamPlayers, getMembershipStatus, onPayMembership, onCustomAbono }) {
  if (teamPlayers.length === 0) {
    return (
      <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '30px' }}>
        No hay jugadores en este equipo. Agrega jugadores en el Roster.
      </p>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '15px' }}>
      {teamPlayers.map(p => (
        <MembershipCard
          key={p.id}
          player={p}
          getMembershipStatus={getMembershipStatus}
          onPayMembership={onPayMembership}
          onCustomAbono={onCustomAbono}
        />
      ))}
    </div>
  );
}
