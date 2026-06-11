import React from 'react';

function WeeklyView({ teamEvents }) {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1));
  const days = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];

  return (
    <div className="glass-panel" style={{ padding: '20px', marginTop: '10px' }}>
      <h4 style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'Outfit', marginBottom: '15px', color: 'var(--color-blue)' }}>
        Cronograma Semanal
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {days.map((dayName, i) => {
          const date = new Date(startOfWeek);
          date.setDate(startOfWeek.getDate() + i);
          const dateStr = date.toISOString().split('T')[0];
          const dayEvents = teamEvents.filter(e => e.date === dateStr).sort((a, b) => a.time.localeCompare(b.time));
          const isToday = date.toISOString().split('T')[0] === today.toISOString().split('T')[0];
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'stretch', gap: '8px',
              padding: '8px', background: isToday ? 'rgba(0, 230, 118, 0.04)' : 'rgba(255,255,255,0.01)',
              border: `1px solid ${isToday ? 'var(--color-primary)' : 'var(--border-glass)'}`,
              borderRadius: 'var(--radius-sm)'
            }}>
              <div style={{
                minWidth: '75px', fontWeight: 700, fontSize: '0.8rem',
                display: 'flex', flexDirection: 'column', justifyContent: 'center',
                color: isToday ? 'var(--color-primary)' : 'var(--color-text-muted)'
              }}>
                {dayName}
                <span style={{ fontSize: '0.6rem', fontWeight: 400 }}>{date.getDate()}/{date.getMonth() + 1}</span>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {dayEvents.length === 0 ? (
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', padding: '4px 0' }}>Sin actividades</span>
                ) : (
                  dayEvents.map(e => (
                    <span key={e.id} style={{
                      fontSize: '0.72rem', padding: '3px 8px', borderRadius: 'var(--radius-sm)',
                      background: e.type === 'partido' ? 'rgba(212, 175, 55, 0.1)' : 'rgba(0, 230, 118, 0.06)',
                      color: e.type === 'partido' ? 'var(--color-gold)' : 'var(--color-primary)',
                      border: `1px solid ${e.type === 'partido' ? 'rgba(212, 175, 55, 0.2)' : 'rgba(0, 230, 118, 0.1)'}`
                    }}>
                      {e.type === 'partido' ? '🏉' : '🏋️'} {e.time} - {e.title}
                      {e.linkedRoutine && <span style={{ fontSize: '0.6rem', marginLeft: '4px', color: 'var(--color-text-muted)' }}>(rutina vinculada)</span>}
                    </span>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default WeeklyView;
