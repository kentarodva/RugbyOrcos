import React, { useState, useMemo } from 'react';
import { FAULT_TYPES } from './constants';
import { PlayerPhoto } from '../PlayerPhoto';

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
  infBurpeesExtra,
  setInfBurpeesExtra,
  infCustomExercise,
  setInfCustomExercise,
  infCustomReps,
  setInfCustomReps,
  infFaultType,
  setInfFaultType,
  infContext,
  setInfContext,
  infNotes,
  setInfNotes,
  teamPlayers,
  onSave
}) {
  const [playerSearch, setPlayerSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredPlayers = useMemo(() => {
    if (!playerSearch.trim()) return teamPlayers;
    const q = playerSearch.toLowerCase();
    return teamPlayers.filter(p =>
      p.name.toLowerCase().includes(q) || (p.apodo || '').toLowerCase().includes(q)
    );
  }, [teamPlayers, playerSearch]);

  const burpeesTotal = (Number(infPenales) || 0) * 10 + (Number(infAmarillas) || 0) * 50 + (Number(infRojas) || 0) * 100 + (Number(infBurpeesExtra) || 0);
  const customReps = Number(infCustomReps) || 0;

  const handleSelectPlayer = (playerId) => {
    setSelectedPlayerForInf(playerId);
    setPlayerSearch('');
    setShowDropdown(false);
  };

  return (
    <div className="glass-panel" style={{ padding: '25px' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '15px' }}>
        Sanciones del Tribunal (Correctivos Fisicos)
      </h3>

      <form onSubmit={onSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '10px' }}>
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

        <div className="form-group" style={{ position: 'relative' }}>
          <label>Seleccionar al Acusado</label>
          {selectedPlayerForInf ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '0.85rem' }}>
                <strong>#{teamPlayers.find(p => p.id === selectedPlayerForInf)?.camiseta ?? '—'}</strong>{' '}
                {teamPlayers.find(p => p.id === selectedPlayerForInf)?.name}
              </span>
              <button type="button" onClick={() => setSelectedPlayerForInf('')} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}>
                ✕
              </button>
            </div>
          ) : (
            <>
              <input
                type="text"
                value={playerSearch}
                onChange={(e) => { setPlayerSearch(e.target.value); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                placeholder="Buscar por nombre o apodo..."
                className="form-input"
                style={{ fontSize: '0.85rem' }}
              />
              {showDropdown && playerSearch.trim() && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                  maxHeight: '200px', overflowY: 'auto',
                  background: 'var(--bg-dark)', border: '1px solid var(--border-glass)',
                  borderRadius: 'var(--radius-sm)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                }}>
                  {filteredPlayers.length > 0 ? (
                    filteredPlayers.map(p => (
                      <div
                        key={p.id}
                        onMouseDown={() => handleSelectPlayer(p.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          padding: '8px 12px', cursor: 'pointer', fontSize: '0.82rem',
                          borderBottom: '1px solid rgba(255,255,255,0.03)',
                          background: 'transparent',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <PlayerPhoto player={p} size={24} />
                        <span>
                          <strong>#{p.camiseta ?? '—'}</strong> {p.name}{' '}
                          <span style={{ color: 'var(--color-primary)', fontSize: '0.7rem' }}>"{p.apodo || ''}"</span>
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '12px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                      Sin resultados para "{playerSearch}"
                    </div>
                  )}
                </div>
              )}
            </>
          )}
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px', textAlign: 'center' }}>
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

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)', gap: '10px', textAlign: 'center' }}>
          <div className="form-group">
            <label style={{ fontSize: '0.7rem' }}>Burpees Directos</label>
            <input type="number" min="0" value={infBurpeesExtra} onChange={(e) => setInfBurpeesExtra(e.target.value)} className="form-input" />
            <span style={{ fontSize: '0.55rem', color: 'var(--color-text-muted)' }}>Cantidad exacta</span>
          </div>
          <div className="form-group" style={{ textAlign: 'left' }}>
            <label style={{ fontSize: '0.7rem' }}>Ejercicio Extra (opcional)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="text" value={infCustomExercise} onChange={(e) => setInfCustomExercise(e.target.value)} placeholder="Ej. Sentadillas, Planchas..." className="form-input" style={{ flex: 1, minWidth: 0, fontSize: '0.78rem' }} />
              <input type="number" min="0" value={infCustomReps} onChange={(e) => setInfCustomReps(e.target.value)} placeholder="Reps" className="form-input" style={{ width: '70px', flexShrink: 0, fontSize: '0.78rem', textAlign: 'center' }} />
            </div>
            <span style={{ fontSize: '0.55rem', color: 'var(--color-text-muted)' }}>Ejercicio + repeticiones como multa</span>
          </div>
        </div>

        {(burpeesTotal > 0 || (customReps > 0 && infCustomExercise.trim())) && (
          <div style={{ padding: '8px 12px', background: 'rgba(255, 92, 77, 0.08)', border: '1px solid rgba(255, 92, 77, 0.2)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-red)', fontWeight: 700 }}>
              Total: {burpeesTotal > 0 ? `${burpeesTotal} Burpees` : ''}
              {burpeesTotal > 0 && customReps > 0 && infCustomExercise.trim() ? ' + ' : ''}
              {customReps > 0 && infCustomExercise.trim() ? `${infCustomExercise.trim()} x${customReps}` : ''}
            </span>
          </div>
        )}

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
