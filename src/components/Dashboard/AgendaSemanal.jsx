import React, { useState, useContext, useMemo } from 'react';
import { Dumbbell, CircleDot, ClipboardList, MapPin, Calendar, CalendarDays } from 'lucide-react';
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

function AgendaSemanal() {
  const { schedule, futureFixtures } = useContext(ClubContext);
  const [viewMode_, setViewMode_] = useState('weekly');
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

  const upcomingByDate = useMemo(() => {
    const groups = {};
    for (const e of allUpcoming) {
      if (!groups[e.date]) groups[e.date] = [];
      groups[e.date].push(e);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [allUpcoming]);

  const totalEvents = allUpcoming.length;

  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'Outfit', color: 'var(--color-primary)' }}>
          <Calendar size={20} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Agenda de la Semana
        </h3>
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '3px' }}>
          <button
            onClick={() => setViewMode_('weekly')}
            style={{
              padding: '6px 14px', border: 'none', borderRadius: '6px', cursor: 'pointer',
              background: viewMode_ === 'weekly' ? 'var(--color-primary)' : 'transparent',
              color: viewMode_ === 'weekly' ? '#000' : 'var(--text-secondary)',
              fontWeight: viewMode_ === 'weekly' ? 700 : 500,
              fontSize: '0.78rem', transition: 'all 0.2s',
            }}
          >
            <CalendarDays size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Semana
          </button>
          <button
            onClick={() => setViewMode_('list')}
            style={{
              padding: '6px 14px', border: 'none', borderRadius: '6px', cursor: 'pointer',
              background: viewMode_ === 'list' ? 'var(--color-primary)' : 'transparent',
              color: viewMode_ === 'list' ? '#000' : 'var(--text-secondary)',
              fontWeight: viewMode_ === 'list' ? 700 : 500,
              fontSize: '0.78rem', transition: 'all 0.2s',
            }}
          >
            <ClipboardList size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Lista ({totalEvents})
          </button>
        </div>
      </div>

      {viewMode_ === 'weekly' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '6px' }}>
          {weekDays.map(day => {
            const all = [...day.events, ...day.fixtures.map(f => ({
              ...f, title: `PARTIDO vs ${f.opponent}`, time: f.time || '', type: 'partido',
            }))];
            return (
              <div
                key={day.dateStr}
                style={{
                  background: day.isToday ? 'rgba(0,230,118,0.08)' : 'rgba(255,255,255,0.02)',
                  border: day.isToday ? '1px solid var(--color-primary)' : '1px solid var(--border-glass)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  minHeight: '100px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 700, fontFamily: 'Outfit',
                    color: day.isToday ? 'var(--color-primary)' : 'var(--text-secondary)',
                    textTransform: 'uppercase',
                  }}>
                    {DIAS[day.date.getDay() === 0 ? 6 : day.date.getDay() - 1]}
                  </span>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 700, fontFamily: 'Outfit',
                    color: day.isToday ? '#000' : 'var(--text-primary)',
                    background: day.isToday ? 'var(--color-primary)' : 'transparent',
                    borderRadius: '50%',
                    width: '22px', height: '22px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {day.date.getDate()}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                  {all.length === 0 ? (
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', opacity: 0.5, textAlign: 'center', marginTop: '8px' }}>
                      —
                    </span>
                  ) : (
                    all.slice(0, 3).map((e, i) => (
                      <div key={i} style={{
                        fontSize: '0.62rem',
                        padding: '2px 4px',
                        background: e.type === 'partido' ? 'rgba(255,179,0,0.1)' : 'rgba(0,230,118,0.08)',
                        borderRadius: '3px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        color: e.type === 'partido' ? '#ffd740' : 'var(--color-primary)',
                      }}>
                        <EventIcon type={e.type} size={12} /> {e.time ? e.time + ' ' : ''}{e.title}
                      </div>
                    ))
                  )}
                  {all.length > 3 && (
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                      +{all.length - 3} más
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {totalEvents === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
              No hay entrenamientos ni partidos agendados para esta categoria.
            </p>
          ) : (
            upcomingByDate.map(([dateStr, events]) => {
              const d = new Date(dateStr + 'T00:00:00');
              const isToday = sameDay(d, today);
              return (
                <div key={dateStr}>
                  <div style={{
                    fontSize: '0.72rem', fontWeight: 700, fontFamily: 'Outfit',
                    color: isToday ? 'var(--color-primary)' : 'var(--text-secondary)',
                    textTransform: 'uppercase', marginBottom: '6px',
                    paddingBottom: '4px', borderBottom: '1px solid var(--border-glass)',
                  }}>
                    {DIAS[d.getDay() === 0 ? 6 : d.getDay() - 1]} {formatLocalDate(d, { day: 'numeric', month: 'short' })}
                    {isToday && ' · HOY'}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {events.map((e, i) => (
                      <div key={i} style={{
                        padding: '10px 12px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border-glass)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex', gap: '10px', alignItems: 'center',
                      }}>
                        <div style={{
                          width: '36px', height: '36px',
                          borderRadius: 'var(--radius-sm)',
                          background: e.type === 'partido' ? 'rgba(255,179,0,0.1)' : 'rgba(0,230,118,0.1)',
                          border: '1px solid rgba(255,255,255,0.05)',
                          display: 'flex', justifyContent: 'center', alignItems: 'center',
                          fontSize: '1rem', flexShrink: 0,
                        }}>
                          <EventIcon type={e.type} size={18} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {e.title}
                          </h4>
                          <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {e.time ? `${e.time} · ` : ''}{e.location || ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default AgendaSemanal;
