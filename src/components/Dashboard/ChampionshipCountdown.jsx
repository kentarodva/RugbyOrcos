import React from 'react';

function CountdownDisplay({ deadlineStr, currentTime }) {
  if (!deadlineStr) return <span style={{ color: 'var(--color-text-muted)' }}>—</span>;
  const deadline = new Date(deadlineStr + 'T00:00:00');
  const diff = deadline - currentTime;

  if (diff <= 0) {
    return <span style={{ color: 'var(--color-text-muted)' }}>Torneo en Curso / Finalizado!</span>;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return (
    <div style={{ display: 'flex', gap: '10px' }}>
      <div style={{ background: 'var(--bg-dark)', padding: '5px 10px', borderRadius: 'var(--radius-sm)', textAlign: 'center', minWidth: '60px' }}>
        <h4 style={{ color: 'var(--color-primary)', fontSize: '1.25rem', fontWeight: 800 }}>{days}</h4>
        <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Dias</p>
      </div>
      <div style={{ background: 'var(--bg-dark)', padding: '5px 10px', borderRadius: 'var(--radius-sm)', textAlign: 'center', minWidth: '60px' }}>
        <h4 style={{ color: 'var(--color-gold)', fontSize: '1.25rem', fontWeight: 800 }}>{hours}</h4>
        <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Horas</p>
      </div>
    </div>
  );
}

function ChampionshipCountdown({ teamChamps, currentTime, onAddChampionship }) {
  return (
    <div className="glass-panel" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'Outfit' }}>Cuenta Regresiva de Campeonatos</h3>
        <button onClick={onAddChampionship} className="btn-outline" style={{ padding: '5px 10px', fontSize: '0.75rem' }}>
          + Anadir Hito
        </button>
      </div>

      {teamChamps.length === 0 ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '15px 0' }}>
          No hay campeonatos agendados. Programa tu meta de temporada!
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {teamChamps.map(c => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>{c.name}</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{c.description}</p>
              </div>
              <div>
                <CountdownDisplay deadlineStr={c.deadlineDate} currentTime={currentTime} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ChampionshipCountdown;
