import React, { useState } from 'react';

function InjurySection({ player, onInjurySubmit, onPhaseChange }) {
  const [showForm, setShowForm] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [weeks, setWeeks] = useState(2);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!diagnosis) return;
    onInjurySubmit(diagnosis, Number(weeks));
    setDiagnosis('');
    setShowForm(false);
  };

  const phases = ['Reposo Absoluto', 'Fortalecimiento', 'Reacondicionamiento', 'Alta para Contacto'];

  return (
    <div style={{ background: 'var(--bg-dark)', padding: '20px', borderRadius: 'var(--radius-lg)', borderLeft: player.estado === 'lesionado' ? '4px solid var(--color-red)' : '1px solid var(--border-glass)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-red)' }}>Control Clinico de Rehabilitacion</h4>

        {player.estado !== 'lesionado' && (
          <button onClick={() => setShowForm(!showForm)} className="btn-outline" style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--color-red)', borderColor: 'rgba(255, 92, 77,0.2)' }}>
            {showForm ? 'Cancelar' : '+ Ingresar a Clinica'}
          </button>
        )}
      </div>

      {player.estado === 'lesionado' ? (
        <div>
          {player.injuryLog && player.injuryLog[0] && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span>Diagnostico: <strong>{player.injuryLog[0].diagnosis}</strong></span>
                <span style={{ color: 'var(--color-red)' }}>{player.injuryLog[0].weeks} Semanas de baja</span>
              </div>

              <div className="form-group" style={{ marginTop: '10px' }}>
                <label>Fase de Recuperacion Medica</label>
                <select
                  value={player.injuryLog[0].phase}
                  onChange={(e) => onPhaseChange(e.target.value)}
                  className="form-select"
                  style={{ borderColor: 'var(--color-red)', color: 'var(--color-red)' }}
                >
                  {phases.map((p, i) => (
                    <option key={i + 1} value={i + 1}>Fase {i + 1}: {p}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
          El jugador se encuentra en optimo estado fisico para entrenamientos y partidos.
        </p>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginTop: '15px', padding: '15px', background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--color-red)', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h5 style={{ fontSize: '0.8rem', color: 'var(--color-red)', fontWeight: 700 }}>EXPEDIENTE DE LESION</h5>
          <div className="form-group">
            <label>Diagnostico Medico</label>
            <input type="text" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Ej. Esguince de tobillo grado I" className="form-input" required />
          </div>
          <div className="form-group">
            <label>Semanas Estimadas de Baja</label>
            <input type="number" min="1" max="52" value={weeks} onChange={(e) => setWeeks(e.target.value)} className="form-input" required />
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '5px' }}>
            <button type="button" onClick={() => setShowForm(false)} className="btn-outline" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Cancelar</button>
            <button type="submit" className="btn-neon" style={{ padding: '5px 10px', fontSize: '0.75rem', background: 'var(--color-red)', boxShadow: '0 4px 15px rgba(255, 92, 77,0.3)' }}>Ingresar</button>
          </div>
        </form>
      )}
    </div>
  );
}

export default InjurySection;
