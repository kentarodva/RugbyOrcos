import React from 'react';

function LivePlayerStats({ events, players }) {
  const playerMap = {};
  for (const p of players) {
    playerMap[p.id] = p;
  }

  const stats = {};
  for (const ev of events) {
    if (ev.team !== 'orcos') continue;
    if (!ev.player_id) continue;
    if (!stats[ev.player_id]) {
      stats[ev.player_id] = { tries: 0, conversions: 0, penalties: 0, dropGoals: 0, yellowCards: 0, redCards: 0 };
    }
    if (ev.event_type === 'try') stats[ev.player_id].tries++;
    else if (ev.event_type === 'conversion') stats[ev.player_id].conversions++;
    else if (ev.event_type === 'penalty') stats[ev.player_id].penalties++;
    else if (ev.event_type === 'drop_goal') stats[ev.player_id].dropGoals++;
    else if (ev.event_type === 'yellow_card') stats[ev.player_id].yellowCards++;
    else if (ev.event_type === 'red_card') stats[ev.player_id].redCards++;
  }

  const playerIds = Object.keys(stats);
  if (playerIds.length === 0) {
    return null;
  }

  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      <h4 style={{ marginBottom: '10px', fontWeight: 700, fontSize: '0.9rem' }}>📊 ESTADÍSTICAS EN VIVO</h4>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ textAlign: 'left', padding: '6px 4px' }}>Jugador</th>
              <th style={{ textAlign: 'center', padding: '6px 4px' }}>Tries</th>
              <th style={{ textAlign: 'center', padding: '6px 4px' }}>Conv</th>
              <th style={{ textAlign: 'center', padding: '6px 4px' }}>Penal</th>
              <th style={{ textAlign: 'center', padding: '6px 4px' }}>Drop</th>
              <th style={{ textAlign: 'center', padding: '6px 4px' }}>🟨</th>
              <th style={{ textAlign: 'center', padding: '6px 4px' }}>🟥</th>
            </tr>
          </thead>
          <tbody>
            {playerIds.map(pid => {
              const s = stats[pid];
              const p = playerMap[pid];
              return (
                <tr key={pid} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                  <td style={{ padding: '6px 4px', fontWeight: 600 }}>
                    {p ? `#${p.camiseta || '—'} ${p.name}` : pid.slice(0, 8)}
                  </td>
                  <td style={{ textAlign: 'center', padding: '6px 4px', color: s.tries > 0 ? 'var(--color-primary)' : undefined, fontWeight: s.tries > 0 ? 700 : undefined }}>{s.tries || '—'}</td>
                  <td style={{ textAlign: 'center', padding: '6px 4px' }}>{s.conversions || '—'}</td>
                  <td style={{ textAlign: 'center', padding: '6px 4px' }}>{s.penalties || '—'}</td>
                  <td style={{ textAlign: 'center', padding: '6px 4px' }}>{s.dropGoals || '—'}</td>
                  <td style={{ textAlign: 'center', padding: '6px 4px', color: s.yellowCards > 0 ? 'var(--color-gold)' : undefined }}>{s.yellowCards || '—'}</td>
                  <td style={{ textAlign: 'center', padding: '6px 4px', color: s.redCards > 0 ? 'var(--color-red)' : undefined }}>{s.redCards || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LivePlayerStats;
