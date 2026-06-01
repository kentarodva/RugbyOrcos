import React from 'react';
import { formatLocalDate } from '../../../utils/dates.js';

function AgendaCard({ event, onDelete, onWhatsApp }) {
  const isMatch = event.title.toUpperCase().includes('PARTIDO');
  const dateFormatted = formatLocalDate(new Date(event.date + 'T00:00:00'), {
    weekday: 'long', month: 'short', day: 'numeric'
  });

  return (
    <div
      className="glass-panel animated-slide"
      style={{
        padding: '20px',
        borderLeft: isMatch ? '4px solid var(--color-gold)' : '4px solid var(--color-primary)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span className="badge badge-active" style={{ background: 'var(--bg-dark)', color: isMatch ? 'var(--color-gold)' : 'var(--color-primary)', fontSize: '0.65rem', marginBottom: '5px' }}>
            {isMatch ? 'Partido Competitivo' : 'Entrenamiento Tactico'}
          </span>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 800 }}>{event.title}</h4>
        </div>

        <button
          onClick={() => onDelete(event.id)}
          className="btn-outline"
          style={{ padding: '4px 8px', fontSize: '0.7rem', color: 'var(--color-red)', borderColor: 'rgba(255,61,0,0.1)' }}
          title="Eliminar Evento"
        >
          Borrar
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{dateFormatted}</span>
          <span style={{ color: 'var(--color-text-muted)' }}>|</span>
          <strong style={{ color: 'var(--color-gold)' }}>{event.time} PM</strong>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{event.location}</span>
        </div>

        <a
          href={event.mapsLink}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--color-primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}
        >
          Ver Ubicacion en Google Maps →
        </a>
      </div>

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
