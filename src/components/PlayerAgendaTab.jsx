import React, { useState } from 'react';
import { formatLocalDate } from '../utils/dates';
import WeeklyView from './Calendario/AgendaTab/WeeklyView';

function PlayerAgendaTab({ myTeamEvents, myUpcomingMatches, allCalendarEvents, handleOpenDetail, eventRsvpCounts, myRsvp, myRsvpMap = {}, onRsvp }) {
  const [showCalendarView, setShowCalendarView] = useState(false);

  return (
    <>
      <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ color: 'var(--color-primary)', fontSize: '1rem', fontWeight: 700, fontFamily: 'Outfit' }}>
            Agenda del Equipo
          </h3>
          <button
            onClick={() => setShowCalendarView(!showCalendarView)}
            className="btn-outline"
            style={{ padding: '4px 12px', fontSize: '0.7rem', borderColor: 'var(--color-blue)', color: 'var(--color-blue)' }}
          >
            {showCalendarView ? '📋 Vista Lista' : '📅 Vista Calendario'}
          </button>
        </div>

        {showCalendarView ? (
          <WeeklyView teamEvents={allCalendarEvents} />
        ) : (
          myTeamEvents.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {myTeamEvents.map((e, i) => {
              const d = new Date(e.date + 'T00:00:00');
              const isToday = d.toDateString() === new Date().toDateString();
              const isMultiDay = e.endDate && e.endDate > e.date;
              const hasNotes = !!e.notes;
              const counts = eventRsvpCounts[e.id] || { going: 0, maybe: 0, notGoing: 0 };
              return (
                <div key={e.id || i} onClick={() => handleOpenDetail(e)}
                  style={{
                    padding: '12px 14px', cursor: 'pointer',
                    background: isToday ? 'rgba(0,230,118,0.06)' : 'rgba(255,255,255,0.02)',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${isToday ? 'var(--color-primary)' : 'var(--border-glass)'}`,
                    display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem',
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = isToday ? 'var(--color-primary)' : 'var(--border-glass)'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 700, color: isToday ? 'var(--color-primary)' : 'var(--color-text)' }}>
                        {e.type === 'partido' ? '🏉' : '🏋️'} {e.title}
                      </span>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px', flexWrap: 'wrap' }}>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>
                          {formatLocalDate(d, { weekday: 'short', day: 'numeric', month: 'short' })}
                          {isMultiDay && (
                            <> → {formatLocalDate(new Date(e.endDate + 'T00:00:00'), { day: 'numeric', month: 'short' })}</>
                          )}
                          {' · '}{e.time}
                        </span>
                        {e.recurrence && e.recurrence !== 'none' && (
                          <span className="badge" style={{
                            background: 'rgba(100,100,255,0.1)', border: '1px solid var(--color-blue)',
                            color: 'var(--color-blue)', fontSize: '0.55rem', padding: '1px 6px'
                          }}>
                            {e.recurrence === 'semanal' ? 'Semanal' : e.recurrence === 'quincenal' ? 'Quincenal' : 'Personalizado'}
                          </span>
                        )}
                        {isMultiDay && (
                          <span className="badge" style={{
                            background: 'rgba(255,179,0,0.1)', border: '1px solid var(--color-gold)',
                            color: 'var(--color-gold)', fontSize: '0.55rem', padding: '1px 6px'
                          }}>
                            Multi-dia
                          </span>
                        )}
                      </div>
                      {e.linkedRoutine && (
                        <div style={{ fontSize: '0.65rem', color: 'var(--color-primary)', marginTop: '2px', opacity: 0.7 }}>
                          💪 Rutina: {e.linkedRoutine}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>{e.location}</div>
                      {e.mapsLink && (
                        <a href={e.mapsLink} target="_blank" rel="noopener noreferrer"
                          onClick={ev => ev.stopPropagation()}
                          style={{ fontSize: '0.62rem', color: 'var(--color-primary)', display: 'inline-block', marginTop: '2px' }}>
                          📍 Maps
                        </a>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {hasNotes && (
                      <span style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)', background: 'rgba(255,255,255,0.03)', padding: '2px 8px', borderRadius: '10px' }}>
                        📝 {e.notes.length > 40 ? e.notes.slice(0, 40) + '...' : e.notes}
                      </span>
                    )}
                    {counts.going + counts.maybe + counts.notGoing > 0 && (
                      <span style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)' }}>
                        ✅ {counts.going} van{counts.maybe > 0 ? ` · ❓ ${counts.maybe} tal vez` : ''}
                      </span>
                    )}
                    {onRsvp && (
                      <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }} onClick={e => e.stopPropagation()}>
                        {[{ key: 'going', label: '✅ Voy', color: 'var(--color-primary)' }, { key: 'maybe', label: '❓ Tal vez', color: 'var(--color-gold)' }, { key: 'not_going', label: '❌ No voy', color: 'var(--color-red)' }].map(opt => {
                          const isActive = myRsvpMap[e.id] === opt.key;
                          return (
                            <button key={opt.key} onClick={() => onRsvp(e.id, opt.key)}
                              style={{
                                padding: '2px 6px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 700, cursor: 'pointer',
                                background: isActive ? `${opt.color}20` : 'transparent',
                                border: `1px solid ${isActive ? opt.color : 'rgba(255,255,255,0.1)'}`,
                                color: isActive ? opt.color : 'var(--color-text-muted)',
                                transition: 'all 0.15s',
                              }}
                            >{opt.label}</button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null
      )}
      </div>

      {myUpcomingMatches.length > 0 && (
        <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
          <h3 style={{ color: 'var(--color-gold)', fontSize: '1rem', fontWeight: 700, marginBottom: '12px', fontFamily: 'Outfit' }}>
            Proximos Partidos
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {myUpcomingMatches.map((f, i) => {
              const daysUntil = Math.ceil((new Date(f.date + 'T00:00:00') - new Date()) / (1000 * 60 * 60 * 24));
              return (
                <div key={f.id || i} style={{
                  padding: '10px 12px', background: daysUntil <= 7 ? 'rgba(255,179,0,0.06)' : 'rgba(255,255,255,0.02)',
                  borderRadius: 'var(--radius-sm)', border: `1px solid ${daysUntil <= 7 ? 'var(--color-gold)' : 'var(--border-glass)'}`,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', fontSize: '0.78rem',
                }}>
                  <span style={{ fontWeight: 700 }}>vs {f.opponent}</span>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>
                    {formatLocalDate(new Date(f.date + 'T00:00:00'), { weekday: 'short', day: 'numeric', month: 'short' })}
                    {f.time ? ` · ${f.time}` : ''}
                    {daysUntil <= 7 ? ` (${daysUntil}d)` : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

export default PlayerAgendaTab;
