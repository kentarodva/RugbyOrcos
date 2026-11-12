import React from 'react';

function RankingPanel({ title, color, players, renderValue, label, emptyMessage }) {
  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px', marginBottom: '12px' }}>
        {title}
      </h4>
      {players.length === 0 ? (
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '10px 0' }}>{emptyMessage}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {players.map((p, idx) => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
              <span>{idx + 1}. <strong>{p.name}</strong></span>
              <span className="badge" style={{ fontSize: '0.7rem', border: `1px solid ${color}`, color, background: `${color}08` }}>
                {label} {renderValue(p)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RankingsTab({ honorOrcs, mvpLeaders, tryLeaders, tackleLeaders, dungeonOrcs }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '20px' }}>

      <RankingPanel
        title="Orcos de Honor (Asistencia)"
        color="var(--color-primary)"
        players={honorOrcs}
        renderValue={(p) => `${p.attRate}%`}
        label="% Asist."
        emptyMessage="Sin datos de asistencia aun."
      />

      <RankingPanel
        title="Gladiadores (MVPs del Club)"
        color="var(--color-gold)"
        players={mvpLeaders}
        renderValue={(p) => p.mvps}
        label="MVPs"
        emptyMessage="No hay MVPs registrados aun."
      />

      <RankingPanel
        title="Demoletries (Anotadores)"
        color="#FF5C4D"
        players={tryLeaders}
        renderValue={(p) => p.totalTries}
        label="Tries"
        emptyMessage="No hay tries anotados aun."
      />

      <RankingPanel
        title="Murallas Verdes (Tacles)"
        color="var(--color-blue)"
        players={tackleLeaders}
        renderValue={(p) => p.totalTackles}
        label="Tacles"
        emptyMessage="No hay tacles registrados aun."
      />

      <RankingPanel
        title="El Calabozo (Penitencias)"
        color="var(--color-red)"
        players={dungeonOrcs}
        renderValue={(p) => p.penalties.burpees}
        label="Burpees"
        emptyMessage="Calabozo libre de prisioneros!"
      />

    </div>
  );
}

export default RankingsTab;
