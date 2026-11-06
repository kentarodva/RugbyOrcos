import React from 'react';
import { formatLocalDate } from '../../../utils/dates.js';
import { getEventTypeMeta } from '../../../utils/eventTypes';
import EventRsvp from './EventRsvp';

function EventDetailModal({ event, onClose, players, rsvpList, myRsvp, onRsvp }) {
  if (!event) return null;
  const eventDate = new Date(event.date + 'T00:00:00');
  const dateFormatted = formatLocalDate(eventDate, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const isMultiDay = event.endDate && event.endDate > event.date;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="glass-panel animated-slide"
        style={{
          maxWidth: '560px', width: '100%', maxHeight: '80vh', overflowY: 'auto',
          padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 600 }}>{event.title}</h3>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              {getEventTypeMeta(event.type).emoji} {getEventTypeMeta(event.type).label}
            </div>
          </div>
          <button onClick={onClose} className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
            Cerrar ✕
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
          <div><strong>Fecha:</strong> {dateFormatted}</div>
          {isMultiDay && (
            <div><strong>Hasta:</strong> {formatLocalDate(new Date(event.endDate + 'T00:00:00'), { weekday: 'long', month: 'long', day: 'numeric' })}</div>
          )}
          <div><strong>Hora:</strong> {event.time} PM</div>
          <div><strong>Lugar:</strong> {event.location}</div>
          {event.mapsLink && (
            <a href={event.mapsLink} target="_blank" rel="noopener noreferrer"
               style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
              Ver en Google Maps →
            </a>
          )}
          {event.linkedRoutine && (
            <div><strong>Rutina vinculada:</strong> {event.linkedRoutine}</div>
          )}
          {event.recurrence && event.recurrence !== 'none' && (
            <div><strong>Recurrencia:</strong> {
              event.recurrence === 'semanal' ? 'Semanal (x4)' :
              event.recurrence === 'quincenal' ? 'Quincenal (x2)' : 'Personalizado'
            }</div>
          )}
        </div>

        {event.notes && (
          <div style={{
            background: 'rgba(255,255,255,0.02)', padding: '14px',
            borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)',
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-muted)' }}>
              Notas / Instrucciones
            </div>
            <div style={{ fontSize: '0.82rem', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {event.notes}
            </div>
          </div>
        )}

        <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '16px' }}>
          <EventRsvp
            eventId={event.id}
            myRsvp={myRsvp}
            onRsvp={onRsvp}
            players={players}
            rsvpList={rsvpList}
          />
        </div>
      </div>
    </div>
  );
}

export default EventDetailModal;
