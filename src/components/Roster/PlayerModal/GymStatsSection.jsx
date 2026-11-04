import React, { useState } from 'react';
import { WeightInput } from '../../common/FormattedInputs';

function GymStatsSection({ player, onGymSubmit }) {
  const [showForm, setShowForm] = useState(false);
  const [gym, setGym] = useState({
    squat: player.gymStats?.squat || 0,
    bench: player.gymStats?.bench || 0,
    deadlift: player.gymStats?.deadlift || 0,
    weight: player.weight || 85
  });

  const set = (key) => (e) => setGym(prev => ({ ...prev, [key]: Number(e.target.value) }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onGymSubmit(gym);
    setShowForm(false);
  };

  const squat = player.gymStats?.squat || 0;
  const bench = player.gymStats?.bench || 0;
  const deadlift = player.gymStats?.deadlift || 0;
  const weight = player.weight || 85;
  const totalLifts = squat + bench + deadlift;
  const ratio = weight > 0 ? (totalLifts / weight).toFixed(2) : '0.00';

  let rank = 'Principiante';
  let rankColor = 'var(--color-text-muted)';
  if (ratio >= 5.0) { rank = 'Elite del Clan'; rankColor = 'var(--color-primary)'; }
  else if (ratio >= 4.0) { rank = 'Avanzado'; rankColor = 'var(--color-gold)'; }
  else if (ratio >= 3.0) { rank = 'Intermedio'; rankColor = 'var(--color-blue)'; }

  return (
    <div style={{ background: 'var(--bg-dark)', padding: '20px', borderRadius: 'var(--radius-lg)', borderLeft: '4px solid var(--color-primary)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-primary)' }}>Records de Fuerza RPG (1RM)</h4>
        <button
          onClick={() => {
            if (showForm) { setShowForm(false); return; }
            setGym({
              squat: player.gymStats?.squat || 0,
              bench: player.gymStats?.bench || 0,
              deadlift: player.gymStats?.deadlift || 0,
              weight: player.weight || 85
            });
            setShowForm(true);
          }}
          className="btn-outline"
          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
        >
          {showForm ? 'Cancelar' : 'Actualizar Levantes'}
        </button>
      </div>

      {!showForm ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', textAlign: 'center' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 5px', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', display: 'block' }}>SENTADILLA</span>
              <strong style={{ fontSize: '1rem', color: 'var(--color-primary)' }}>{squat} Kg</strong>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 5px', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', display: 'block' }}>PECHO (BENCH)</span>
              <strong style={{ fontSize: '1rem', color: 'var(--color-gold)' }}>{bench} Kg</strong>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 5px', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', display: 'block' }}>PESO MUERTO</span>
              <strong style={{ fontSize: '1rem', color: 'var(--color-blue)' }}>{deadlift} Kg</strong>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 5px', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', display: 'block' }}>PESO CORPORAL</span>
              <strong style={{ fontSize: '1rem', color: 'var(--color-text)' }}>{weight} Kg</strong>
            </div>
          </div>

          <div style={{ background: 'rgba(255, 61, 0, 0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', padding: '12px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Indice de Fuerza Relativa:</span>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: rankColor, marginTop: '2px' }}>{ratio} x Peso Corp.</h4>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'block' }}>RANGO TACTICO</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: rankColor }}>{rank}</span>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--color-primary)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="form-group">
              <label style={{ fontSize: '0.75rem' }}>Sentadilla 1RM</label>
              <WeightInput value={gym.squat} onChange={set('squat')} required />
            </div>
            <div className="form-group">
              <label style={{ fontSize: '0.75rem' }}>Press de Banca 1RM</label>
              <WeightInput value={gym.bench} onChange={set('bench')} required />
            </div>
            <div className="form-group">
              <label style={{ fontSize: '0.75rem' }}>Peso Muerto 1RM</label>
              <WeightInput value={gym.deadlift} onChange={set('deadlift')} required />
            </div>
            <div className="form-group">
              <label style={{ fontSize: '0.75rem' }}>Peso Corporal Actual</label>
              <WeightInput value={gym.weight} onChange={set('weight')} required />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '5px' }}>
            <button type="button" onClick={() => setShowForm(false)} className="btn-outline" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Cancelar</button>
            <button type="submit" className="btn-neon" style={{ padding: '5px 10px', fontSize: '0.75rem' }}>Guardar Record</button>
          </div>
        </form>
      )}
    </div>
  );
}

export default GymStatsSection;
