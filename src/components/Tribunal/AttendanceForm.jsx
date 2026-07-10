import React, { useState, useMemo } from 'react';
import { ATTENDANCE_STATUS } from './constants';
import { PlayerPhoto } from '../PlayerPhoto';

const ICON_MAP = {
  entrenamiento: '🏋️',
  partido: '🏉',
  reunion: '📋',
  otro: '📌',
};

const RSVP_ICON = { going: '✅', maybe: '❓', not_going: '❌' };

function AttendanceForm({
  selectedEventId,
  onEventChange,
  teamEvents,
  attendanceState,
  rsvpMap,
  onMarkConfirmedPresent,
  teamPlayers,
  onAttendanceChange,
  onSave
}) {
  const [playerSearch, setPlayerSearch] = useState('');
  const [onlyConfirmed, setOnlyConfirmed] = useState(false);

  const handleToggleConfirmed = () => {
    const next = !onlyConfirmed;
    setOnlyConfirmed(next);
    if (next && onMarkConfirmedPresent) onMarkConfirmedPresent();
  };

  const sortedEvents = [...(teamEvents || [])].sort(
    (a, b) => new Date(a.date + 'T' + (a.time || '00:00')) - new Date(b.date + 'T' + (b.time || '00:00'))
  );

  const filteredPlayers = useMemo(() => {
    let list = teamPlayers;
    if (playerSearch.trim()) {
      const q = playerSearch.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) || (p.apodo || '').toLowerCase().includes(q)
      );
    }
    if (onlyConfirmed) {
      list = list.filter(p => rsvpMap[p.id] === 'going');
    }
    return list;
  }, [teamPlayers, playerSearch, onlyConfirmed, rsvpMap]);

  const confirmedCount = Object.values(rsvpMap).filter(s => s === 'going').length;
  const markedCount = Object.keys(attendanceState).length;

  return (
    <div className="glass-panel" style={{ padding: '25px' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'Outfit', color: 'var(--color-primary)', marginBottom: '15px' }}>
        Control de Asistencia del Entrenamiento
      </h3>

      <form onSubmit={onSave}>
        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label>Evento Vinculado</label>
          <select
            value={selectedEventId}
            onChange={(e) => onEventChange(e.target.value)}
            className="form-input"
            style={{ fontSize: '0.8rem' }}
          >
            <option value="">Sin evento específico</option>
            {sortedEvents.map(e => (
              <option key={e.id} value={e.id}>
                {ICON_MAP[e.type] || '📌'} {e.date} — {e.title} {e.time ? `(${e.time})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '320px', overflowY: 'auto', marginBottom: '20px', paddingRight: '5px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              value={playerSearch}
              onChange={(e) => setPlayerSearch(e.target.value)}
              placeholder="Buscar guerrero..."
              className="form-input"
              style={{ flex: 1, padding: '6px 10px', fontSize: '0.78rem' }}
            />
            {selectedEventId && confirmedCount > 0 && (
              <button
                type="button"
                onClick={handleToggleConfirmed}
                className={onlyConfirmed ? 'btn-neon' : 'btn-outline'}
                style={{ padding: '6px 10px', fontSize: '0.7rem', whiteSpace: 'nowrap' }}
              >
                {onlyConfirmed ? `✅ ${filteredPlayers.length} conf.` : `Solo conf. (${confirmedCount})`}
              </button>
            )}
            {playerSearch.trim() && (
              <button type="button" onClick={() => setPlayerSearch('')} className="btn-outline" style={{ padding: '6px 10px', fontSize: '0.7rem' }}>
                ✕
              </button>
            )}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textAlign: 'right' }}>
            Mostrando {filteredPlayers.length} de {teamPlayers.length} jugadores{selectedEventId && confirmedCount > 0 ? ` · ${confirmedCount} confirmados` : ''} — {markedCount} marcados
          </div>
          {filteredPlayers.map(p => {
            const currentStatus = attendanceState[p.id] || '';
            const rsvp = rsvpMap[p.id];
            return (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <PlayerPhoto player={p} size={28} />
                  <div>
                    <strong style={{ fontSize: '0.8rem' }}>{p.name}</strong>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', marginLeft: '4px' }}>("{p.apodo}")</span>
                    {rsvp && <span style={{ marginLeft: '4px', fontSize: '0.75rem' }} title={rsvp === 'going' ? 'Confirmado' : rsvp === 'maybe' ? 'Quizas' : 'No va'}>{RSVP_ICON[rsvp]}</span>}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '4px' }}>
                  {Object.entries(ATTENDANCE_STATUS).map(([key, config]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => onAttendanceChange(p.id, key)}
                      style={{
                        background: currentStatus === key ? config.bg : 'transparent',
                        color: currentStatus === key ? config.color : 'var(--color-text-muted)',
                        border: '1px solid ' + (currentStatus === key ? config.color : 'rgba(255,255,255,0.05)'),
                        padding: '3px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer'
                      }}
                      title={config.penalty}
                    >
                      {config.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <button type="submit" className="btn-neon" style={{ width: '100%', justifyContent: 'center' }}>
          Guardar Asistencia
        </button>
      </form>
    </div>
  );
}

export default AttendanceForm;
