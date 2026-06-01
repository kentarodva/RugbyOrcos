import React from 'react';

function AttendanceTimeline({ teamPlayers }) {
  if (teamPlayers.length === 0) return null;
  const avgAtt = teamPlayers.reduce((s, p) => {
    const a = p.attendance || {};
    return s + (a.total > 0 ? a.present / a.total : 0);
  }, 0) / teamPlayers.length;
  const pct = Math.round(avgAtt * 100);
  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <h3 style={{ fontSize: '0.9rem', fontWeight: 700, fontFamily: 'Outfit', color: 'var(--color-gold)' }}>
        Asistencia del Clan
      </h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ flex: 1, height: '12px', background: 'var(--bg-dark)', borderRadius: '6px', overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: `var(--color-${pct >= 90 ? 'primary' : pct >= 70 ? 'gold' : 'red'})`, borderRadius: '6px', transition: 'width 0.8s' }} />
        </div>
        <span style={{ fontWeight: 800, fontSize: '1.1rem', color: `var(--color-${pct >= 90 ? 'primary' : pct >= 70 ? 'gold' : 'red'})`, fontFamily: 'Outfit', minWidth: '45px', textAlign: 'right' }}>{pct}%</span>
      </div>
      <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textAlign: 'right' }}>
        Promedio historico del equipo activo
      </p>
    </div>
  );
}

export default AttendanceTimeline;
