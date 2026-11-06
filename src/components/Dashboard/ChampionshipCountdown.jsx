import React from 'react';

function CountdownDisplay({ deadlineStr, currentTime }) {
  if (!deadlineStr) return <span style={{ color: 'var(--color-text-muted)' }}>—</span>;
  const diff = new Date(deadlineStr + 'T00:00:00') - currentTime;
  if (diff <= 0) return <span className="badge">En curso</span>;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  return (
    <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
      <span className="stat-number" style={{ fontSize: '1.5rem', color: 'var(--color-primary)' }}>{days}</span>
      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{days === 1 ? 'día' : 'días'} · {hours} h</span>
    </span>
  );
}

function ChampionshipCountdown({ teamChamps, currentTime, onAddChampionship }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h3 className="section-title">Campeonatos</h3>
        <button type="button" onClick={onAddChampionship} className="link-btn">+ Añadir</button>
      </div>
      <div className="glass-panel">
        {teamChamps.length === 0 ? (
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', padding: '14px 16px' }}>
            Sin campeonatos agendados.
          </p>
        ) : (
          teamChamps.map((c, i) => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', padding: '12px 16px', borderTop: i ? '1px solid var(--border-glass)' : 'none' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{c.name}</div>
                {c.description && <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{c.description}</div>}
              </div>
              <CountdownDisplay deadlineStr={c.deadlineDate} currentTime={currentTime} />
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default ChampionshipCountdown;
