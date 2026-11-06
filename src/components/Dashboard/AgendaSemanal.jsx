import React, { useContext, useMemo } from 'react';
import { Dumbbell, CircleDot, ClipboardList, MapPin } from 'lucide-react';
import { ClubContext } from '../../context/ClubContext';
import { useFilterByView } from '../../context/hooks/useFilterByView';
import { formatLocalDate } from '../../utils/dates.js';

const DIAS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

const EventIcon = ({ type, size = 14 }) => {
  switch (type) {
    case 'entrenamiento': return <Dumbbell size={size} />;
    case 'partido': return <CircleDot size={size} />;
    case 'reunion': return <ClipboardList size={size} />;
    default: return <MapPin size={size} />;
  }
};

function getWeekRange(date) {
  const d = new Date(date);
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { monday, sunday };
}

function sameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

function AgendaSemanal({ onNavigate }) {
  const { schedule, futureFixtures } = useContext(ClubContext);
  const filterByView = useFilterByView();

  const filteredSchedule = useMemo(() => {
    return filterByView(schedule || [])
      .filter(s => {
        const eventStart = new Date(s.date + 'T' + (s.time || '00:00'));
        return new Date(eventStart.getTime() + 3 * 60 * 60 * 1000) >= new Date();
      })
      .sort((a, b) => new Date(a.date + 'T' + (a.time || '00:00')) - new Date(b.date + 'T' + (b.time || '00:00')));
  }, [schedule, filterByView]);

  const filteredFuture = useMemo(() => {
    return filterByView(futureFixtures || [])
      .filter(f => new Date(f.date + 'T23:59:59') >= new Date())
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [futureFixtures, filterByView]);

  const { monday } = getWeekRange(new Date());
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayEvents = filteredSchedule.filter(s => s.date === dateStr);
    const dayFixtures = filteredFuture.filter(f => f.date === dateStr);
    weekDays.push({
      date: d,
      dateStr,
      isToday: sameDay(d, today),
      events: dayEvents,
      fixtures: dayFixtures,
    });
  }

  const allUpcoming = [
    ...filteredSchedule.map(e => ({ ...e, _type: 'schedule' })),
    ...filteredFuture.map(f => ({
      ...f,
      _type: 'future',
      title: `PARTIDO vs ${f.opponent}`,
      time: f.time || '',
      location: f.location || '',
      type: 'partido',
    })),
  ].sort((a, b) => new Date(a.date + 'T' + (a.time || '00:00')) - new Date(b.date + 'T' + (b.time || '00:00')));

  const totalEvents = allUpcoming.length;
  const nextEvents = allUpcoming.slice(0, 4);

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '10px' }}>
        <h3 className="section-title">Esta semana</h3>
        {onNavigate && (
          <button type="button" className="link-btn" onClick={() => onNavigate('calendario')}>
            Ver agenda
          </button>
        )}
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '2px', padding: '8px' }}>
          {weekDays.map((day) => {
            const count = day.events.length + day.fixtures.length;
            const hasMatch = day.fixtures.length > 0 || day.events.some((e) => e.type === 'partido');
            return (
              <div
                key={day.dateStr}
                aria-label={`${DIAS[day.date.getDay() === 0 ? 6 : day.date.getDay() - 1]} ${day.date.getDate()}: ${count} eventos`}
                style={{
                  height: '58px',
                  borderRadius: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '3px',
                  background: day.isToday ? 'var(--color-primary)' : 'transparent',
                  color: day.isToday ? 'var(--color-on-primary)' : 'var(--color-text-soft)',
                }}
              >
                <span style={{ fontSize: '0.6875rem', fontWeight: 600, opacity: 0.85 }}>
                  {DIAS[day.date.getDay() === 0 ? 6 : day.date.getDay() - 1].charAt(0)}
                </span>
                <span className="stat-number" style={{ fontSize: '1.2rem' }}>{day.date.getDate()}</span>
                <span
                  aria-hidden="true"
                  style={{
                    width: '5px', height: '5px', borderRadius: '99px',
                    background: count === 0 ? 'transparent' : day.isToday ? 'var(--color-on-primary)' : hasMatch ? 'var(--color-gold)' : 'var(--color-primary)',
                  }}
                />
              </div>
            );
          })}
        </div>

        <div style={{ borderTop: '1px solid var(--border-glass)' }}>
          {totalEvents === 0 ? (
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', padding: '16px', textAlign: 'center' }}>
              Nada agendado por ahora.
            </p>
          ) : (
            nextEvents.map((e, i) => {
              const d = new Date(e.date + 'T00:00:00');
              const isMatch = e.type === 'partido';
              return (
                <div
                  key={`${e.date}-${i}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 14px',
                    borderTop: i === 0 ? 'none' : '1px solid var(--border-glass)',
                  }}
                >
                  <div style={{ width: '40px', textAlign: 'center', flexShrink: 0, color: sameDay(d, today) ? 'var(--color-primary)' : 'var(--color-text)' }}>
                    <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'inherit', opacity: 0.8, textTransform: 'uppercase' }}>
                      {DIAS[d.getDay() === 0 ? 6 : d.getDay() - 1]}
                    </div>
                    <div className="stat-number" style={{ fontSize: '1.375rem' }}>{d.getDate()}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {isMatch && e._type === 'future' ? `Partido vs ${e.opponent}` : e.title}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <EventIcon type={e.type} size={13} />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {[e.time, e.location].filter(Boolean).join(' · ') || formatLocalDate(d, { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>
                  {isMatch && <span className="badge badge-gold">Partido</span>}
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}

export default AgendaSemanal;
