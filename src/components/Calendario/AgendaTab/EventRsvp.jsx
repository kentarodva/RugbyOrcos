import React from 'react';

function EventRsvp({ eventId, myRsvp, onRsvp, players, rsvpList }) {
  const statuses = [
    { value: 'going', label: 'Voy', icon: '✅', color: 'var(--color-green)' },
    { value: 'maybe', label: 'Tal vez', icon: '❓', color: 'var(--color-gold)' },
    { value: 'not_going', label: 'No voy', icon: '❌', color: 'var(--color-red)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Confirmar Asistencia</label>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {statuses.map(s => (
          <button
            key={s.value}
            type="button"
            onClick={() => onRsvp(eventId, s.value)}
            className={myRsvp === s.value ? 'btn-neon' : 'btn-outline'}
            style={{
              padding: '6px 14px', fontSize: '0.78rem',
              borderColor: myRsvp === s.value ? s.color : 'var(--border-glass)',
            }}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {rsvpList && rsvpList.length > 0 && (
        <div style={{ fontSize: '0.75rem' }}>
          <div style={{ fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-muted)' }}>
            Confirmaciones ({rsvpList.filter(r => r.status === 'going').length} van, {rsvpList.filter(r => r.status === 'maybe').length} tal vez, {rsvpList.filter(r => r.status === 'not_going').length} no van)
          </div>
          {['going', 'maybe', 'not_going'].map(status => {
            const items = rsvpList.filter(r => r.status === status);
            if (items.length === 0) return null;
            const label = status === 'going' ? '✅ Van' : status === 'maybe' ? '❓ Tal vez' : '❌ No van';
            return (
              <div key={status} style={{ marginBottom: '4px' }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.68rem' }}>{label}:</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
                  {items.map(r => {
                    const player = players.find(p => p.id === r.player_id);
                    return (
                      <span key={r.player_id} className="badge" style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--border-glass)',
                        fontSize: '0.65rem'
                      }}>
                        {player?.name || player?.nombre || 'Jugador'}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default EventRsvp;
