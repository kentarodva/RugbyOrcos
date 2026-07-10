import React, { useRef, useEffect } from 'react';

const EVENT_ICONS = {
  try: '🏉',
  conversion: '⚡',
  penalty: '🎯',
  drop_goal: '🦵',
  yellow_card: '🟨',
  red_card: '🟥',
  substitution: '🔄',
  note: '📝',
  half_start: '▶️',
  half_end: '⏸️',
  score_adjust: '📊',
};

const EVENT_LABELS = {
  try: 'Try',
  conversion: 'Conversión',
  penalty: 'Penal',
  drop_goal: 'Drop Goal',
  yellow_card: 'Tarjeta Amarilla',
  red_card: 'Tarjeta Roja',
  substitution: 'Cambio',
  note: 'Nota',
  half_start: 'Inicio',
  half_end: 'Fin',
  score_adjust: 'Puntos rival',
};

function formatMinute(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}'${String(s).padStart(2, '0')}''`;
}

function EventTimeline({ events }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events.length]);

  if (!events || events.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        No hay eventos registrados aún.
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ padding: '20px', maxHeight: '300px', overflowY: 'auto' }}>
      <h4 style={{ marginBottom: '10px', fontWeight: 700, fontSize: '0.9rem' }}>📋 TIMELINE</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {events.map((ev, idx) => {
          const isOrcos = ev.team === 'orcos';
          return (
            <div
              key={ev.id || idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                background: isOrcos ? 'rgba(0, 230, 118, 0.05)' : 'rgba(255, 61, 0, 0.05)',
                borderLeft: `3px solid ${isOrcos ? 'var(--color-primary)' : 'var(--color-red)'}`,
                fontSize: '0.8rem',
              }}
            >
              <span style={{ fontWeight: 700, color: 'var(--color-text-muted)', minWidth: '45px', fontSize: '0.7rem' }}>
                {formatMinute(ev.minute)}
              </span>
              <span style={{ fontSize: '1rem' }}>{EVENT_ICONS[ev.event_type] || '📌'}</span>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 600 }}>{EVENT_LABELS[ev.event_type] || ev.event_type}</span>
                {ev.details?.player_name && (
                  <span style={{ color: 'var(--color-text-muted)' }}> — {ev.details.player_name}</span>
                )}
                {ev.event_type === 'score_adjust' && ev.details?.points && (
                  <span style={{ color: 'var(--color-red)' }}> — +{ev.details.points} pts{ev.details?.note ? ` (${ev.details.note})` : ''}</span>
                )}
                {ev.details?.note && ev.event_type !== 'score_adjust' && (
                  <span style={{ color: 'var(--color-text-muted)' }}> — {ev.details.note}</span>
                )}
              </div>
              <span style={{
                fontSize: '0.6rem',
                fontWeight: 700,
                color: isOrcos ? 'var(--color-primary)' : 'var(--color-red)',
                textTransform: 'uppercase',
              }}>
                {isOrcos ? 'ORCOS' : 'RIVAL'}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

export default EventTimeline;
