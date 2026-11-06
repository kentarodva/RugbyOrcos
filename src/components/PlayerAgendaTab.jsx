import React, { useState, useContext } from 'react';
import { ClubContext } from '../context/ClubContext';
import TeamCrest from './common/TeamCrest';
import { findRivalForFixture, resolveCrestUrl } from '../utils/crests';
import { Calendar, List, CheckCircle2, HelpCircle, XCircle, MapPin, Clock, Users } from 'lucide-react';
import { formatLocalDate } from '../utils/dates';
import { getEventTypeMeta } from '../utils/eventTypes';
import WeeklyView from './Calendario/AgendaTab/WeeklyView';
import PushOptIn from './common/PushOptIn';

const AVAILABILITY_OPTIONS = [
  { key: 'going', label: 'Disponible', Icon: CheckCircle2, color: 'var(--color-primary)' },
  { key: 'maybe', label: 'Duda', Icon: HelpCircle, color: 'var(--color-gold)' },
  { key: 'not_going', label: 'Baja', Icon: XCircle, color: 'var(--color-red)' },
];

function PlayerAgendaTab({
  playerId,
  myUpcomingMatches = [],
  allCalendarEvents = [],
  handleOpenDetail,
  eventRsvpCounts = {},
  myRsvpMap = {},
  onRsvp,
  onSetMatchAvailability,
}) {
  const [showCalendarView, setShowCalendarView] = useState(false);
  const { rivals = [] } = useContext(ClubContext) || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <PushOptIn />
      {/* Epic Match Day / Upcoming Matches Hero Section */}
      {myUpcomingMatches.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {myUpcomingMatches.map((f, i) => {
            const matchDate = new Date(f.date + 'T' + (f.time || '15:30:00'));
            const diffTime = matchDate.getTime() - Date.now();
            const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const availMap = f.availabilities || {};
            const myStatus = playerId ? availMap[playerId] : null;
            const goingCount = Object.values(availMap).filter(v => v === 'going').length;
            const rival = findRivalForFixture(f, rivals) || { name: f.opponent };
            const rivalCrest = resolveCrestUrl(rival);
            const isClasico = /guepardo/i.test(f.opponent || '');

            return (
              <div
                key={f.id || i}
                className="glass-panel"
                style={{
                  padding: '24px',
                  borderRadius: '18px',
                  background: 'linear-gradient(135deg, rgba(255, 215, 64, 0.08) 0%, rgba(12, 22, 35, 0.96) 50%, rgba(255, 23, 68, 0.08) 100%)',
                  border: '1px solid rgba(255, 215, 64, 0.4)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 0 24px rgba(255, 215, 64, 0.05)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Top Badge: Countdown and Category */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>⚔️</span>
                    <span style={{ fontSize: '0.74rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--color-gold)' }}>
                      CONVOCATORIA OFICIAL DE PARTIDO
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {daysUntil >= 0 && (
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: '20px',
                          background: daysUntil <= 3 ? 'rgba(255, 23, 68, 0.2)' : 'rgba(255, 215, 64, 0.15)',
                          border: `1px solid ${daysUntil <= 3 ? '#ff1744' : 'var(--color-gold)'}`,
                          color: daysUntil <= 3 ? '#ff5252' : 'var(--color-gold)',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                        }}
                      >
                        ⏱️ {daysUntil === 0 ? '¡HOY ES EL PARTIDO!' : daysUntil === 1 ? '¡MAÑANA!' : `Faltan ${daysUntil} días`}
                      </span>
                    )}

                    <span className="pro-chip pro-chip-success" style={{ fontSize: '0.72rem', fontWeight: 800 }}>
                      <Users size={12} style={{ display: 'inline', marginRight: '4px' }} />
                      {goingCount} guerreros confirmados
                    </span>
                  </div>
                </div>

                {/* Match Versus Banner */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto 1fr',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '16px 0',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    marginBottom: '16px',
                  }}
                >
                  {/* Team Orcos */}
                  <div style={{ textAlign: 'center' }}>
                    <img
                      src="/assets/orcos_official.png"
                      alt="Orcos Rugby Club"
                      style={{
                        width: '64px',
                        height: '64px',
                        objectFit: 'contain',
                        borderRadius: '14px',
                        background: '#ffffff',
                        padding: '4px',
                        margin: '0 auto 8px',
                        display: 'block',
                        boxShadow: '0 0 20px rgba(0, 230, 118, 0.35)',
                        border: '2px solid rgba(0, 230, 118, 0.6)',
                      }}
                    />
                    <div style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '1.15rem', color: '#fff' }}>
                      Orcos Rugby Club
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 700 }}>
                      Corozal, Sucre (Local)
                    </div>
                  </div>

                  {/* VS Emblem */}
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(255, 215, 64, 0.3) 0%, rgba(255, 23, 68, 0.35) 100%)',
                        border: '2px solid rgba(255, 215, 64, 0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '0.95rem',
                        color: 'var(--color-gold)',
                        margin: '0 auto 6px',
                        boxShadow: '0 0 18px rgba(255, 215, 64, 0.3)',
                      }}
                    >
                      VS
                    </div>
                    {isClasico && (
                      <span style={{ fontSize: '0.65rem', color: 'var(--color-gold)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
                        Clásico Sucreño
                      </span>
                    )}
                  </div>

                  {/* Rival */}
                  <div style={{ textAlign: 'center' }}>
                    {rivalCrest ? (
                      <img
                        src={rivalCrest}
                        alt={f.opponent}
                        style={{
                          width: '64px',
                          height: '64px',
                          objectFit: 'contain',
                          borderRadius: '14px',
                          background: '#ffffff',
                          padding: '4px',
                          margin: '0 auto 8px',
                          display: 'block',
                          boxShadow: '0 0 20px rgba(255, 61, 0, 0.35)',
                          border: '2px solid rgba(255, 61, 0, 0.6)',
                        }}
                      />
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                        <TeamCrest name={f.opponent} color="#ff7043" size={64} rounded="14px" glow />
                      </div>
                    )}
                    <div style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '1.15rem', color: '#fff' }}>
                      {f.opponent}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#ff7043', fontWeight: 700 }}>
                      {isClasico ? 'Sincelejo, Sucre (Visitante)' : 'Visitante'}
                    </div>
                  </div>
                </div>

                {/* Match Logistics Info */}
                <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={16} color="var(--color-gold)" />
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>
                      {formatLocalDate(new Date(f.date + 'T00:00:00'), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={16} color="var(--color-gold)" />
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>
                      {f.time || '15:30'} COL
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={16} color="var(--color-primary)" />
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>
                      {f.location || 'Estadio San Francisco'}
                    </span>
                  </div>
                </div>

                {/* Interactive Availability Action Buttons */}
                {playerId && onSetMatchAvailability && (
                  <div
                    style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      borderRadius: '12px',
                      padding: '14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fff' }}>
                        ¿Asistirás a esta batalla, Guerrero?
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                        {myStatus === 'going' && '🟢 Has confirmado tu asistencia oficial.'}
                        {myStatus === 'maybe' && '🟡 Reportaste estado de duda/por confirmar.'}
                        {myStatus === 'not_going' && '🔴 Notificaste que no podrás asistir.'}
                        {!myStatus && 'Aún no has respondido a la convocatoria del partido.'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {AVAILABILITY_OPTIONS.map(opt => {
                        const isActive = myStatus === opt.key;
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => onSetMatchAvailability(f.id, playerId, opt.key)}
                            style={{
                              padding: '8px 16px',
                              borderRadius: '8px',
                              fontSize: '0.76rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              background: isActive ? `${opt.color}25` : 'rgba(255, 255, 255, 0.04)',
                              border: `1px solid ${isActive ? opt.color : 'rgba(255, 255, 255, 0.12)'}`,
                              color: isActive ? opt.color : 'var(--color-text-muted)',
                              boxShadow: isActive ? `0 0 12px ${opt.color}40` : 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <opt.Icon size={14} />
                            {opt.label === 'Disponible' ? '⚔️ ¡Voy al Partido!' : opt.label}
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
      )}

      {/* Main Team Schedule & Calendar Section */}
      <div className="glass-panel" style={{ padding: '22px', borderRadius: '18px' }}>
        <div className="pro-section-header" style={{ marginBottom: '16px' }}>
          <div className="pro-section-title" style={{ fontSize: '1.05rem', fontWeight: 800 }}>
            <Calendar size={18} color="var(--color-primary)" />
            <span>Calendario Oficial de Entrenamientos & Partidos</span>
          </div>
          <button
            onClick={() => setShowCalendarView(!showCalendarView)}
            className="btn-outline"
            style={{
              padding: '6px 14px',
              fontSize: '0.75rem',
              fontWeight: 700,
              borderColor: 'var(--color-blue)',
              color: 'var(--color-blue)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {showCalendarView ? <><List size={14} /> Ver en Lista</> : <><Calendar size={14} /> Ver en Calendario Semanal</>}
          </button>
        </div>

        {showCalendarView ? (
          <WeeklyView teamEvents={allCalendarEvents} />
        ) : (
          allCalendarEvents.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {allCalendarEvents.map((e, i) => {
                const d = new Date(e.date + 'T00:00:00');
                const isToday = d.toDateString() === new Date().toDateString();
                const isMultiDay = e.endDate && e.endDate > e.date;
                const hasNotes = !!e.notes;
                const isMatch = e.isMatch || e.type === 'partido';
                const counts = eventRsvpCounts[e.id] || { going: 0, maybe: 0, notGoing: 0 };

                return (
                  <div
                    key={e.id || i}
                    onClick={() => handleOpenDetail?.(e)}
                    style={{
                      padding: '14px 16px',
                      cursor: 'pointer',
                      background: isMatch
                        ? 'rgba(255, 215, 64, 0.05)'
                        : isToday
                        ? 'rgba(0, 230, 118, 0.08)'
                        : 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '12px',
                      border: `1px solid ${isMatch ? 'rgba(255, 215, 64, 0.35)' : isToday ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.08)'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={ev => ev.currentTarget.style.borderColor = isMatch ? 'var(--color-gold)' : 'var(--color-primary)'}
                    onMouseLeave={ev => ev.currentTarget.style.borderColor = isMatch ? 'rgba(255, 215, 64, 0.35)' : isToday ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.08)'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          {isMatch ? (
                            <span className="pro-chip pro-chip-warning" style={{ fontSize: '0.68rem', fontWeight: 800 }}>
                              🏉 Partido Oficial
                            </span>
                          ) : (
                            <span className={`pro-chip ${getEventTypeMeta(e.type).chip}`} style={{ fontSize: '0.68rem', fontWeight: 800 }}>
                              {getEventTypeMeta(e.type).emoji} {getEventTypeMeta(e.type).label}
                            </span>
                          )}

                          <span style={{ fontWeight: 800, fontSize: '0.88rem', color: isMatch ? 'var(--color-gold)' : isToday ? 'var(--color-primary)' : '#fff' }}>
                            {e.title}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px', flexWrap: 'wrap' }}>
                          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.74rem' }} className="tabular-nums">
                            📅 {formatLocalDate(d, { weekday: 'short', day: 'numeric', month: 'short' })}
                            {isMultiDay && (
                              <> → {formatLocalDate(new Date(e.endDate + 'T00:00:00'), { day: 'numeric', month: 'short' })}</>
                            )}
                            {' · '}🕒 {e.time || '19:00'}
                          </span>

                          {e.recurrence && e.recurrence !== 'none' && (
                            <span className="pro-chip pro-chip-info" style={{ fontSize: '0.65rem' }}>
                              {e.recurrence === 'semanal' ? 'Semanal' : e.recurrence === 'quincenal' ? 'Quincenal' : 'Personalizado'}
                            </span>
                          )}
                        </div>

                        {e.linkedRoutine && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-primary)', marginTop: '4px' }}>
                            Rutina Táctica: {e.linkedRoutine}
                          </div>
                        )}
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                          📍 {e.location || 'San Francisco'}
                        </div>
                        {e.mapsLink && (
                          <a
                            href={e.mapsLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={ev => ev.stopPropagation()}
                            style={{ fontSize: '0.68rem', color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '3px' }}
                          >
                            <MapPin size={11} /> Ver en Maps
                          </a>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', paddingTop: '4px' }}>
                      {hasNotes && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', background: 'rgba(255,255,255,0.04)', padding: '3px 10px', borderRadius: '10px' }}>
                          💬 {e.notes.length > 50 ? e.notes.slice(0, 50) + '...' : e.notes}
                        </span>
                      )}

                      {!isMatch && counts.going + counts.maybe + counts.notGoing > 0 && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }} className="tabular-nums">
                          {counts.going} asistencias registradas
                        </span>
                      )}

                      {!isMatch && onRsvp && (
                        <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }} onClick={ev => ev.stopPropagation()}>
                          {AVAILABILITY_OPTIONS.map(opt => {
                            const isActive = myRsvpMap[e.id] === opt.key;
                            return (
                              <button
                                key={opt.key}
                                onClick={() => onRsvp(e.id, opt.key)}
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  background: isActive ? `${opt.color}20` : 'transparent',
                                  border: `1px solid ${isActive ? opt.color : 'rgba(255,255,255,0.1)'}`,
                                  color: isActive ? opt.color : 'var(--color-text-muted)',
                                  transition: 'all 0.15s',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <opt.Icon size={12} />
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
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '24px 0' }}>
              No hay sesiones ni partidos próximos programados en la fortaleza.
            </p>
          )
        )}
      </div>
    </div>
  );
}

export default PlayerAgendaTab;
