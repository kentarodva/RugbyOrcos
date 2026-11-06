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
    <div className="glass-panel" style={{ padding: '16px' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '15px' }}>
        Pasar lista
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '60vh', overflowY: 'auto', marginBottom: '20px', paddingRight: '5px' }}>
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
              <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <PlayerPhoto player={p} size={28} />
                  <span style={{ flex: 1, minWidth: 0, fontSize: '0.875rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.name}
                    {p.apodo && <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: '6px' }}>«{p.apodo}»</span>}
                  </span>
                  {rsvp && <span style={{ fontSize: '0.8rem', flexShrink: 0 }} title={rsvp === 'going' ? 'Confirmado' : rsvp === 'maybe' ? 'Quizás' : 'No va'}>{RSVP_ICON[rsvp]}</span>}
                </div>

                <div role="group" aria-label={`Asistencia de ${p.name}`} style={{ display: 'grid', gridTemplateColumns: `repeat(${Object.keys(ATTENDANCE_STATUS).length}, minmax(0, 1fr))`, gap: '6px' }}>
                  {Object.entries(ATTENDANCE_STATUS).map(([key, config]) => {
                    const on = currentStatus === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        aria-pressed={on}
                        onClick={() => onAttendanceChange(p.id, key)}
                        style={{
                          minHeight: '36px', minWidth: 0, padding: '0 4px',
                          background: on ? config.bg : 'transparent',
                          color: on ? config.color : 'var(--color-text-muted)',
                          border: '1px solid ' + (on ? config.color : 'var(--border-strong)'),
                          borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                          lineHeight: 1.15, overflowWrap: 'anywhere'
                        }}
                        title={config.penalty}
                      >
                        {config.label}
                      </button>
                    );
                  })}
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
