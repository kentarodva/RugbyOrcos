import React from 'react';
import { formatLocalDate } from '../../../utils/dates.js';

function FutureCard({ future, onDelete }) {
  const daysUntil = Math.ceil((new Date(future.date + 'T00:00:00') - new Date()) / (1000 * 60 * 60 * 24));
  const isSoon = daysUntil <= 7 && daysUntil >= 0;

  return (
    <div
      className="glass-panel animated-slide"
      style={{
        padding: '20px',
        borderLeft: isSoon ? '4px solid var(--color-gold)' : '4px solid rgba(255,255,255,0.1)',
        position: 'relative'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span className="badge" style={{
          background: isSoon ? 'rgba(255, 234, 0, 0.1)' : 'rgba(255,255,255,0.05)',
          color: isSoon ? 'var(--color-gold)' : 'var(--color-text-muted)',
          border: `1px solid ${isSoon ? 'var(--color-gold)' : 'rgba(255,255,255,0.1)'}`,
          fontSize: '0.65rem',
          fontWeight: 700
        }}>
          {daysUntil <= 0 ? 'HOY' : daysUntil === 1 ? 'MANANA' : `EN ${daysUntil} DIAS`}
        </span>

        <button
          onClick={() => onDelete(future.id)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--color-red)',
            cursor: 'pointer',
            fontSize: '0.8rem',
            opacity: 0.6
          }}
          title="Eliminar fixture"
        >
          X
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '15px 0' }}>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-primary)' }}>Orcos</h4>
        </div>
        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>VS</div>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>{future.opponent}</h4>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
        <div>
          <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.65rem' }}>LUGAR</span>
          <strong>{future.location || 'Por definir'}</strong>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.65rem' }}>HORA</span>
          <strong>{future.time || 'Por definir'}</strong>
        </div>
      </div>

      {future.notes && (
        <div style={{ marginTop: '10px', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
          {future.notes}
        </div>
      )}

      <div style={{ marginTop: '10px', fontSize: '0.7rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
        {formatLocalDate(new Date(future.date + 'T00:00:00'), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </div>
    </div>
  );
}

export default FutureCard;
