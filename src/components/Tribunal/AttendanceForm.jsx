import React from 'react';
import { ATTENDANCE_STATUS } from './constants';

function AttendanceForm({
  sessionDate,
  setSessionDate,
  attendanceState,
  teamPlayers,
  onAttendanceChange,
  onSave
}) {
  return (
    <div className="glass-panel" style={{ padding: '25px' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'Outfit', color: 'var(--color-primary)', marginBottom: '15px' }}>
        Control de Asistencia del Entrenamiento
      </h3>

      <form onSubmit={onSave}>
        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label>Fecha de la Sesion</label>
          <input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} className="form-input" required />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '320px', overflowY: 'auto', marginBottom: '20px', paddingRight: '5px' }}>
          {teamPlayers.map(p => {
            const currentStatus = attendanceState[p.id] || 'presente';
            return (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)' }}>
                <div>
                  <strong style={{ fontSize: '0.8rem' }}>{p.name}</strong>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', marginLeft: '4px' }}>("{p.apodo}")</span>
                </div>

                <div style={{ display: 'flex', gap: '4px' }}>
                  {Object.entries(ATTENDANCE_STATUS).filter(([key]) => key !== 'falta_justificada').map(([key, config]) => (
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
          Guardar Asistencia de Hoy
        </button>
      </form>
    </div>
  );
}

export default AttendanceForm;
