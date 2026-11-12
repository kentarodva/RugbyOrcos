import React, { useState, useMemo } from 'react';
import { localDateKey } from '../../../utils/agendaItems';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAY_LABELS = ['Dom','Lun','Mar','Mie','Jue','Vie','Sab'];

function MonthlyView({ teamEvents }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const monthEvents = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    return teamEvents.filter(e => {
      const d = new Date(e.date + 'T00:00:00');
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [teamEvents, viewDate]);

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();

  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayEvents = monthEvents.filter(e => e.date === dateStr);
      days.push({ date: dateStr, day: d, events: dayEvents });
    }
    return days;
  }, [viewDate, daysInMonth, firstDayOfWeek, monthEvents]);

  return (
    <div className="glass-panel" style={{ padding: '20px', marginTop: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <button onClick={prevMonth} className="btn-outline" style={{ padding: '4px 12px', fontSize: '0.78rem' }}>‹ Mes anterior</button>
        <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)' }}>
          {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
        </h4>
        <button onClick={nextMonth} className="btn-outline" style={{ padding: '4px 12px', fontSize: '0.78rem' }}>Mes siguiente ›</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '4px' }}>
        {DAY_LABELS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '0.68rem', fontWeight: 700, color: 'var(--color-text-muted)', padding: '6px 0' }}>{d}</div>
        ))}
        {calendarDays.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;
          const isToday = localDateKey(today) === day.date;
          return (
            <div key={day.date} style={{
              minHeight: '70px', padding: '4px', borderRadius: 'var(--radius-sm)',
              background: isToday ? 'rgba(46, 229, 122,0.06)' : 'rgba(255,255,255,0.01)',
              border: `1px solid ${isToday ? 'var(--color-primary)' : 'var(--border-glass)'}`,
              fontSize: '0.65rem', overflow: 'hidden',
            }}>
              <div style={{ fontWeight: isToday ? 800 : 500, marginBottom: '2px', color: isToday ? 'var(--color-primary)' : 'var(--color-text)' }}>
                {day.day}
              </div>
              {day.events.slice(0, 2).map(e => (
                <div key={e.id} style={{
                  padding: '1px 3px', marginBottom: '1px', borderRadius: '2px',
                  background: e.type === 'partido' ? 'rgba(255, 92, 77,0.15)' : 'rgba(90, 169, 255,0.12)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  fontSize: '0.58rem', fontWeight: 500,
                }}>
                  {e.time?.slice(0, 5)} {e.title}
                </div>
              ))}
              {day.events.length > 2 && (
                <div style={{ fontSize: '0.55rem', color: 'var(--color-text-muted)' }}>+{day.events.length - 2} más</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MonthlyView;
