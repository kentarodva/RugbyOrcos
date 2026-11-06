import React, { useState } from 'react';

function DivisionComparison({ allPlayers }) {
  const [expanded, setExpanded] = useState(false);
  const divisions = ['masculina_mayor', 'femenina_mayor', 'juveniles_masculina', 'juveniles_femenina'];
  const labels = { masculina_mayor: 'Masculina Mayor', femenina_mayor: 'Femenina Mayor', juveniles_masculina: 'Juveniles M', juveniles_femenina: 'Juveniles F' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <button onClick={() => setExpanded(!expanded)} className="btn-outline" style={{ padding: '8px 16px', fontSize: '0.8rem', alignSelf: 'flex-start' }}>
        {expanded ? 'Ocultar' : 'Comparar Divisiones'}
      </button>
      {expanded && (
        <div className="animated-slide" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '10px' }}>
          {divisions.map(div => {
            const p = allPlayers.filter(pl => pl.teamCategory?.includes(div));
            const activos = p.filter(pl => pl.estado === 'activo').length;
            const tries = p.reduce((s, pl) => s + (pl.matchStats || []).reduce((a, b) => a + (b.tries || 0), 0), 0);
            return (
              <div key={div} className="glass-panel" style={{ padding: '12px', textAlign: 'center', borderTop: '2px solid var(--color-primary)' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>{labels[div]}</p>
                <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-display)' }}>{p.length}</p>
                <p style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>guerreros</p>
                <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '8px', fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
                  <span>{activos}</span>
                  <span>{tries}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default DivisionComparison;
