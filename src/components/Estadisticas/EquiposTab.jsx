import React, { useMemo } from 'react';
import { DonutChart, COLORS } from './charts.jsx';

export default function EquiposTab({ players, makgoraTeams }) {
  const data = useMemo(() => {
    const m = {};
    for (const p of players) {
      if (p.makgora_team_id) {
        const name = makgoraTeams?.find(t => t.id === p.makgora_team_id)?.rpg_name || 'Otro';
        m[name] = (m[name] || 0) + 1;
      }
    }
    return Object.entries(m).sort((a, b) => b[1] - a[1]).map(([label, value], i) => ({ label, value, color: COLORS[i % COLORS.length] }));
  }, [players, makgoraTeams]);

  if (data.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
        Sin asignación a equipos Mak'Gora en esta vista
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
      <DonutChart data={data} title="Equipos Mak'Gora" centerLabel="jug" />
    </div>
  );
}
