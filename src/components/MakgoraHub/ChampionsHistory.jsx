import React from 'react';

function ChampionsHistory({ tournaments, teams, onSelect }) {
  const finished = tournaments.filter(t => t.status === 'finalizado' || t.winner_team_id);

  if (finished.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        🏆 Aún no hay torneos finalizados. ¡El primer campeón será leyenda!
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'Outfit', color: 'var(--color-gold)' }}>
        🏆 Salón de Campeones
      </h3>
      {finished.map(t => {
        const winner = teams.find(team => team.id === t.winner_team_id);
        return (
          <div key={t.id} className="glass-panel" style={{
            padding: '20px', display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', flexWrap: 'wrap', gap: '12px',
            cursor: 'pointer', transition: 'all 0.2s',
          }} onClick={() => onSelect(t)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '2rem' }}>👑</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{t.edition_name || t.name}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                  {t.start_date ? new Date(t.start_date).toLocaleDateString('es-CO') : '—'} → {t.end_date ? new Date(t.end_date).toLocaleDateString('es-CO') : '—'}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              {winner ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Campeón:</span>
                  <span style={{
                    fontWeight: 800, fontSize: '1rem', color: 'var(--color-gold)',
                    textShadow: '0 0 10px rgba(255,179,0,0.3)',
                  }}>
                    {winner.rpg_name || winner.name}
                  </span>
                </div>
              ) : (
                <span style={{ color: 'var(--color-text-muted)' }}>Sin campeón registrado</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ChampionsHistory;
