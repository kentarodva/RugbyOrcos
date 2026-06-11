import React, { useMemo } from 'react';

function MiniRanking({ teamPlayers }) {
  const rankings = useMemo(() => {
    const players = teamPlayers.filter(p => p.rol !== 'Entrenador');

    const byAttendance = [...players]
      .sort((a, b) => {
        const aPct = (a.attendance?.present || 0) / Math.max((a.attendance?.total || 1), 1);
        const bPct = (b.attendance?.present || 0) / Math.max((b.attendance?.total || 1), 1);
        return bPct - aPct;
      })
      .slice(0, 3);

    const byMvp = [...players]
      .sort((a, b) => {
        const aMvps = (a.matchStats || []).filter(s => s.mvp).length;
        const bMvps = (b.matchStats || []).filter(s => s.mvp).length;
        return bMvps - aMvps;
      })
      .slice(0, 3);

    const byTries = [...players]
      .sort((a, b) => {
        const aTries = (a.matchStats || []).reduce((s, m) => s + (m.tries || 0), 0);
        const bTries = (b.matchStats || []).reduce((s, m) => s + (m.tries || 0), 0);
        return bTries - aTries;
      })
      .slice(0, 3);

    return { byAttendance, byMvp, byTries };
  }, [teamPlayers]);

  const renderTop3 = (items, label, medalEmoji, statFn) => (
    <div>
      <h4 style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: '8px', color: 'var(--color-gold)' }}>
        {medalEmoji} {label}
      </h4>
      {items.length === 0 ? (
        <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>Sin datos aún</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {items.map((p, i) => (
            <div key={p.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '4px 8px', borderRadius: 'var(--radius-sm)',
              background: i === 0 ? 'rgba(255,179,0,0.08)' : 'rgba(255,255,255,0.01)',
              fontSize: '0.72rem'
            }}>
              <span>
                <span style={{ fontWeight: 700, marginRight: '4px' }}>{['🥇','🥈','🥉'][i]}</span>
                {p.name}
              </span>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.65rem' }}>{statFn(p)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'Outfit' }}>🏆 Ranking del Clan</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
        {renderTop3(rankings.byAttendance, 'Asistencia', '✅', p =>
          `${p.attendance?.present || 0}/${p.attendance?.total || 0}`
        )}
        {renderTop3(rankings.byMvp, 'MVPs', '👑', p =>
          `${(p.matchStats || []).filter(s => s.mvp).length} MVP`
        )}
        {renderTop3(rankings.byTries, 'Tries', '🏉', p =>
          `${(p.matchStats || []).reduce((s, m) => s + (m.tries || 0), 0)} tries`
        )}
      </div>
    </div>
  );
}

export default MiniRanking;
