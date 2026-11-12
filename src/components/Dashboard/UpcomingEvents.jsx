import React from 'react';

function UpcomingEvents({ teamSchedule }) {
  const upcoming = teamSchedule
    .filter(s => new Date(s.date + 'T23:59:59') >= new Date())
    .slice(0, 3);

  return (
    <div className="glass-panel" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Proximas Citas (Agenda)</h3>

      {upcoming.length === 0 ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '20px 0' }}>
          No hay entrenamientos ni partidos agendados en esta categoria.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {upcoming.map(e => {
            const isMatch = e.title.includes('PARTIDO');
            return (
              <div key={e.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ background: isMatch ? 'rgba(232, 185, 49,0.1)' : 'rgba(46, 229, 122,0.1)', border: '1px solid rgba(255,255,255,0.05)', width: '45px', height: '45px', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.25rem' }}>
                  {isMatch ? '🏉' : '🏃‍♂️'}
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700 }}>{e.title}</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>{e.date} | {e.time} PM</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-primary)', marginTop: '4px' }}>{e.location}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default UpcomingEvents;
