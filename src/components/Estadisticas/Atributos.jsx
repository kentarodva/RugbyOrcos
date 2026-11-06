import React from 'react';
import RadarChart from '../Dashboard/RadarChart';
import ForwardsBacksBalance from '../Dashboard/ForwardsBacksBalance';
import DivisionComparison from '../Dashboard/DivisionComparison';

export default function Atributos({ players, allPlayers }) {
  const teamPlayers = players.filter(p => p.rol !== 'Entrenador');

  if (players.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
        No hay jugadores que coincidan con los filtros actuales.
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '14px' }}>
      <div style={{ gridColumn: '1 / -1' }}>
        <RadarChart teamPlayers={teamPlayers} />
      </div>
      <ForwardsBacksBalance teamPlayers={teamPlayers} />
      <DivisionComparison allPlayers={allPlayers.filter(p => p.rol !== 'Entrenador')} />
    </div>
  );
}
