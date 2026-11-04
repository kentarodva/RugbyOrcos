import React, { useState } from 'react';
import { Calendar, List, ShieldAlert, CheckCircle2, HelpCircle, XCircle, MapPin } from 'lucide-react';
import { formatLocalDate } from '../utils/dates';
import WeeklyView from './Calendario/AgendaTab/WeeklyView';

const AVAILABILITY_OPTIONS = [
  { key: 'going', label: 'Disponible', Icon: CheckCircle2, color: 'var(--color-primary)' },
  { key: 'maybe', label: 'Duda', Icon: HelpCircle, color: 'var(--color-gold)' },
  { key: 'not_going', label: 'Baja', Icon: XCircle, color: 'var(--color-red)' },
];

function PlayerAgendaTab({
  playerId,
  myTeamEvents,
  myUpcomingMatches,
  allCalendarEvents,
  handleOpenDetail,
  eventRsvpCounts,
  myRsvpMap = {},
  onRsvp,
  onSetMatchAvailability,
}) {
  const [showCalendarView, setShowCalendarView] = useState(false);

  return (
    <>
      <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
        <div className="pro-section-header" style={{ marginBottom: '12px' }}>
          <div className="pro-section-title" style={{ fontSize: '1rem' }}>
            <Calendar size={18} color="var(--color-primary)" />
            <span>Agenda del Equipo</span>
          </div>
          <button
            onClick={() => setShowCalendarView(!showCalendarView)}
            className="btn-outline"
            style={{ padding: '5px 12px', fontSize: '0.72rem', borderColor: 'var(--color-blue)', color: 'var(--color-blue)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            {showCalendarView ? <><List size={13} /> Vista Lista</> : <><Calendar size={13} /> Vista Calendario</>}
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
                  <div
                    key={e.id || i}
                    onClick={() => handleOpenDetail(e)}
                    style={{
                      padding: '12px 14px', cursor: 'pointer',
                      background: isToday ? 'rgba(0,230,118,0.06)' : 'rgba(255,255,255,0.02)',
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${isToday ? 'var(--color-primary)' : 'var(--border-glass)'}`,
                      display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem',
                      transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={ev => ev.currentTarget.style.borderColor = 'var(--color-primary)'}
                    onMouseLeave={ev => ev.currentTarget.style.borderColor = isToday ? 'var(--color-primary)' : 'var(--border-glass)'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 700, color: isToday ? 'var(--color-primary)' : 'var(--color-text)' }}>
                          {e.title}
                        </span>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px', flexWrap: 'wrap' }}>
                          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }} className="tabular-nums">
                            {formatLocalDate(d, { weekday: 'short', day: 'numeric', month: 'short' })}
                            {isMultiDay && (
                              <> → {formatLocalDate(new Date(e.endDate + 'T00:00:00'), { day: 'numeric', month: 'short' })}</>
                            )}
                            {' · '}{e.time}
                          </span>
                          {e.recurrence && e.recurrence !== 'none' && (
                            <span className="pro-chip pro-chip-info">
                              {e.recurrence === 'semanal' ? 'Semanal' : e.recurrence === 'quincenal' ? 'Quincenal' : 'Personalizado'}
                            </span>
                          )}
                          {isMultiDay && (
                            <span className="pro-chip pro-chip-warning">Multi-día</span>
                          )}
                        </div>
                        {e.linkedRoutine && (
                          <div style={{ fontSize: '0.68rem', color: 'var(--color-primary)', marginTop: '3px' }}>
                            Rutina: {e.linkedRoutine}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>{e.location}</div>
                        {e.mapsLink && (
                          <a
                            href={e.mapsLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={ev => ev.stopPropagation()}
                            style={{ fontSize: '0.65rem', color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}
                          >
                            <MapPin size={11} /> Maps
                          </a>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      {hasNotes && (
                        <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', background: 'rgba(255,255,255,0.03)', padding: '2px 8px', borderRadius: '10px' }}>
                          {e.notes.length > 40 ? e.notes.slice(0, 40) + '...' : e.notes}
                        </span>
                      )}
                      {counts.going + counts.maybe + counts.notGoing > 0 && (
                        <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }} className="tabular-nums">
                          {counts.going} van{counts.maybe > 0 ? ` · ${counts.maybe} duda` : ''}
                        </span>
                      )}
                      {onRsvp && (
                        <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }} onClick={ev => ev.stopPropagation()}>
                          {AVAILABILITY_OPTIONS.map(opt => {
                            const isActive = myRsvpMap[e.id] === opt.key;
                            return (
                              <button
                                key={opt.key}
                                onClick={() => onRsvp(e.id, opt.key)}
                                style={{
                                  padding: '3px 8px', borderRadius: '6px', fontSize: '0.64rem', fontWeight: 700, cursor: 'pointer',
                                  background: isActive ? `${opt.color}20` : 'transparent',
                                  border: `1px solid ${isActive ? opt.color : 'rgba(255,255,255,0.1)'}`,
                                  color: isActive ? opt.color : 'var(--color-text-muted)',
                                  transition: 'all 0.15s',
                                  display: 'inline-flex', alignItems: 'center', gap: '4px'
                                }}
                              >
                                <opt.Icon size={11} />
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '16px 0' }}>
              No hay sesiones próximas programadas.
            </p>
          )
        )}
      </div>

      {myUpcomingMatches.length > 0 && (
        <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
          <div className="pro-section-header" style={{ marginBottom: '12px' }}>
            <div className="pro-section-title" style={{ fontSize: '1rem' }}>
              <ShieldAlert size={18} color="var(--color-gold)" />
              <span>Convocatoria Próximos Partidos</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {myUpcomingMatches.map((f, i) => {
              const daysUntil = Math.ceil((new Date(f.date + 'T00:00:00') - new Date()) / (1000 * 60 * 60 * 24));
              const availMap = f.availabilities || {};
              const myStatus = playerId ? availMap[playerId] : null;
              const goingCount = Object.values(availMap).filter(v => v === 'going').length;

              return (
                <div
                  key={f.id || i}
                  style={{
                    padding: '12px 14px',
                    background: daysUntil <= 7 ? 'rgba(255,179,0,0.06)' : 'rgba(255,255,255,0.02)',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${daysUntil <= 7 ? 'var(--color-gold)' : 'var(--border-glass)'}`,
                    display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <div>
                      <strong style={{ fontSize: '0.9rem' }}>Orcos vs {f.opponent}</strong>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }} className="tabular-nums">
                        {formatLocalDate(new Date(f.date + 'T00:00:00'), { weekday: 'short', day: 'numeric', month: 'short' })}
                        {f.time ? ` · ${f.time}` : ''}
                        {f.location ? ` · ${f.location}` : ''}
                        {daysUntil <= 7 && daysUntil >= 0 ? ` (${daysUntil}d)` : ''}
                      </div>
                    </div>
                    <span className="pro-chip pro-chip-success tabular-nums">
                      {goingCount} confirmados
                    </span>
                  </div>

                  {playerId && onSetMatchAvailability && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', paddingTop: '6px', borderTop: '1px solid var(--border-glass)' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Tu disponibilidad para este partido:</span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {AVAILABILITY_OPTIONS.map(opt => {
                          const isActive = myStatus === opt.key;
                          return (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() => onSetMatchAvailability(f.id, playerId, opt.key)}
                              style={{
                                padding: '4px 10px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer',
                                background: isActive ? `${opt.color}20` : 'transparent',
                                border: `1px solid ${isActive ? opt.color : 'rgba(255,255,255,0.12)'}`,
                                color: isActive ? opt.color : 'var(--color-text-muted)',
                                display: 'inline-flex', alignItems: 'center', gap: '4px'
                              }}
                            >
                              <opt.Icon size={12} />
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
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
