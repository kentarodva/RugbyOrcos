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

  const medal = ['#E8B931', '#C0C6C2', '#CD8B52'];
  const renderTop3 = (items, label, statFn) => (
    <div className="glass-panel" style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>{label}</div>
      {items.length === 0 ? (
        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-subtle)' }}>Sin datos aún</div>
      ) : (
        items.map((p, i) => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', minHeight: '32px' }}>
            <span aria-label={`Puesto ${i + 1}`} style={{ width: 22, height: 22, borderRadius: 99, flexShrink: 0, display: 'grid', placeItems: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#0B0D0C', background: medal[i] }}>{i + 1}</span>
            <span style={{ flex: 1, minWidth: 0, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{statFn(p)}</span>
          </div>
        ))
      )}
    </div>
  );

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <h3 className="section-title">Ranking del clan</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '10px' }}>
        {renderTop3(rankings.byAttendance, 'Asistencia', (p) => `${p.attendance?.present || 0}/${p.attendance?.total || 0}`)}
        {renderTop3(rankings.byMvp, 'MVPs', (p) => `${(p.matchStats || []).filter((s) => s.mvp).length}`)}
        {renderTop3(rankings.byTries, 'Tries', (p) => `${(p.matchStats || []).reduce((s, m) => s + (m.tries || 0), 0)}`)}
      </div>
    </section>
  );
}

export default MiniRanking;
