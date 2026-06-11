import React from 'react';
import { FAULT_TYPES } from './constants';

function InfractionForm({
  matchDate,
  setMatchDate,
  selectedPlayerForInf,
  setSelectedPlayerForInf,
  infPenales,
  setInfPenales,
  infAmarillas,
  setInfAmarillas,
  infRojas,
  setInfRojas,
  infFaultType,
  setInfFaultType,
  infContext,
  setInfContext,
  infNotes,
  setInfNotes,
  teamPlayers,
  onSave
}) {
  return (
    <div className="glass-panel" style={{ padding: '25px' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'Outfit', color: 'var(--color-red)', marginBottom: '15px' }}>
        Sanciones del Tribunal (Correctivos Fisicos)
      </h3>

      <form onSubmit={onSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div className="form-group">
            <label>Fecha de Infraccion</label>
            <input type="date" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} className="form-input" required />
          </div>
          <div className="form-group">
            <label>Contexto</label>
            <select value={infContext} onChange={(e) => setInfContext(e.target.value)} className="form-select">
              <option value="partido">Partido</option>
              <option value="practica">Practica / Entrenamiento</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Seleccionar al Acusado</label>
          <select value={selectedPlayerForInf} onChange={(e) => setSelectedPlayerForInf(e.target.value)} className="form-select" required>
            <option value="">-- Seleccionar --</option>
            {teamPlayers.map(p => (
              <option key={p.id} value={p.id}>#{p.camiseta ?? '—'} {p.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Tipo de Falta</label>
          <select value={infFaultType} onChange={(e) => setInfFaultType(e.target.value)} className="form-select">
            <option value="">-- Sin especificar --</option>
            {FAULT_TYPES.map(ft => (
              <option key={ft.id} value={ft.id}>{ft.label}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center' }}>
          <div className="form-group">
            <label style={{ fontSize: '0.7rem' }}>Penales</label>
            <input type="number" min="0" value={infPenales} onChange={(e) => setInfPenales(e.target.value)} className="form-input" />
            <span style={{ fontSize: '0.55rem', color: 'var(--color-text-muted)' }}>+10 Burpees c/u</span>
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.7rem' }}>Amarillas</label>
            <input type="number" min="0" max="2" value={infAmarillas} onChange={(e) => setInfAmarillas(e.target.value)} className="form-input" />
            <span style={{ fontSize: '0.55rem', color: 'var(--color-text-muted)' }}>+50 Burpees</span>
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.7rem' }}>Rojas</label>
            <input type="number" min="0" max="1" value={infRojas} onChange={(e) => setInfRojas(e.target.value)} className="form-input" />
            <span style={{ fontSize: '0.55rem', color: 'var(--color-text-muted)' }}>+100 Burpees + Susp.</span>
          </div>
        </div>

        <div className="form-group">
          <label>Notas / Observaciones</label>
          <input type="text" value={infNotes} onChange={(e) => setInfNotes(e.target.value)} placeholder="Ej. Minuto 34, tackle alto a apertura rival" className="form-input" />
        </div>

        <button type="submit" className="btn-danger" style={{ justifyContent: 'center' }}>
          Registrar Sancion Correctiva
        </button>
      </form>
    </div>
  );
}

export default InfractionForm;
