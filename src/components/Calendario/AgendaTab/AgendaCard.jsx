import React from 'react';
import { formatLocalDate } from '../../../utils/dates.js';

function AgendaCard({ event, onDelete, onEdit, onWhatsApp, onDetail }) {
  const isMatch = event.title.toUpperCase().includes('PARTIDO');
  const eventDate = new Date(event.date + 'T00:00:00');
  const isPast = eventDate < new Date(new Date().toDateString());
  const dateFormatted = formatLocalDate(eventDate, {
    weekday: 'long', month: 'short', day: 'numeric'
  });
  const isMultiDay = event.endDate && event.endDate > event.date;
  const hasNotes = !!event.notes;
  const rsvpGoing = event.rsvpCounts?.going || 0;
  const rsvpTotal = (event.rsvpCounts?.going || 0) + (event.rsvpCounts?.maybe || 0) + (event.rsvpCounts?.notGoing || 0);

  return (
    <div
      className="glass-panel animated-slide"
      style={{
        padding: '20px',
        borderLeft: isPast ? '4px solid var(--color-text-muted)' : isMatch ? '4px solid var(--color-gold)' : '4px solid var(--color-primary)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        opacity: isPast ? 0.65 : 1,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '5px', flexWrap: 'wrap' }}>
            <span className="badge badge-active" style={{ background: 'var(--bg-dark)', color: isPast ? 'var(--color-text-muted)' : isMatch ? 'var(--color-gold)' : 'var(--color-primary)', fontSize: '0.65rem' }}>
              {isPast ? 'Completado' : isMatch ? 'Partido Competitivo' : 'Entrenamiento Tactico'}
            </span>
            {event.recurrence && event.recurrence !== 'none' && (
              <span className="badge" style={{ background: 'rgba(100,100,255,0.1)', border: '1px solid var(--color-blue)', color: 'var(--color-blue)', fontSize: '0.6rem' }}>
                {event.recurrence === 'semanal' ? 'Semanal' : event.recurrence === 'quincenal' ? 'Quincenal' : 'Personalizado'}
              </span>
            )}
            {isMultiDay && (
              <span className="badge" style={{ background: 'rgba(255,179,0,0.1)', border: '1px solid var(--color-gold)', color: 'var(--color-gold)', fontSize: '0.6rem' }}>
                Multi-dia
              </span>
            )}
            {hasNotes && (
              <span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)' }}>
                📝
              </span>
            )}
          </div>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 800 }}>{event.title}</h4>
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
          <button
            onClick={() => onDetail(event)}
            className="btn-outline"
            style={{ padding: '4px 8px', fontSize: '0.7rem', color: 'var(--color-primary)', borderColor: 'rgba(0,200,255,0.2)' }}
            title="Ver Detalle del Evento"
          >
            Detalle
          </button>
          <button
            onClick={() => onEdit(event)}
            className="btn-outline"
            style={{ padding: '4px 8px', fontSize: '0.7rem', color: 'var(--color-gold)', borderColor: 'rgba(255,179,0,0.2)' }}
            title="Editar Evento"
          >
            Editar
          </button>
          <button
            onClick={() => onDelete(event.id)}
            className="btn-outline"
            style={{ padding: '4px 8px', fontSize: '0.7rem', color: 'var(--color-red)', borderColor: 'rgba(255,61,0,0.1)' }}
            title="Eliminar Evento"
          >
            Borrar
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{dateFormatted}</span>
          {isMultiDay && (
            <>
              <span style={{ color: 'var(--color-text-muted)' }}>→</span>
              <span>{formatLocalDate(new Date(event.endDate + 'T00:00:00'), { month: 'short', day: 'numeric' })}</span>
            </>
          )}
          <span style={{ color: 'var(--color-text-muted)' }}>|</span>
          <strong style={{ color: 'var(--color-gold)' }}>{event.time} PM</strong>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{event.location}</span>
        </div>

        {event.mapsLink && (
          <a
            href={event.mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--color-primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}
          >
            Ver Ubicacion en Google Maps →
          </a>
        )}

        {hasNotes && (
          <div style={{
            fontSize: '0.72rem', color: 'var(--color-text-muted)',
            background: 'rgba(255,255,255,0.02)', padding: '6px 10px',
            borderRadius: 'var(--radius-sm)', marginTop: '4px',
            border: '1px solid rgba(255,255,255,0.03)',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {event.notes}
          </div>
        )}

        {rsvpTotal > 0 && (
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Confirmados: {rsvpGoing}/{rsvpTotal}
          </div>
        )}
      </div>

      {event.linkedRoutine && (
        <div style={{ fontSize: '0.68rem', color: 'var(--color-primary)', opacity: 0.7 }}>
          Rutina: {event.linkedRoutine}
        </div>
      )}

      <div style={{ marginTop: '5px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
        <button
          onClick={() => onWhatsApp(event)}
          className="btn-neon"
          style={{
            width: '100%',
            justifyContent: 'center',
            fontSize: '0.8rem',
            background: 'linear-gradient(135deg, #128c7e, #25d366)',
            color: '#fff',
            boxShadow: '0 4px 15px rgba(37, 211, 102, 0.2)'
          }}
        >
          Copiar y Convocar por WhatsApp →
        </button>
      </div>
    </div>
  );
}

export default AgendaCard;
