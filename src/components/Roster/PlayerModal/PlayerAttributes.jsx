import React, { useState } from 'react';
import PlayerChart from '../PlayerChart';

function PlayerAttributes({ player, onTestSubmit }) {
  const [showForm, setShowForm] = useState(false);
  const [test, setTest] = useState({
    squat: 120, bench: 90, sprint: 5.3,
    broncoMin: 5, broncoSec: 10, illinois: 16.5
  });

  const set = (key) => (e) => setTest(prev => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const forceRPG = Math.min(100, Math.max(10, Math.round(((Number(test.squat) + Number(test.bench)) / 320) * 100)));
    const speedRPG = Math.min(100, Math.max(10, Math.round(100 - (Number(test.sprint) - 4.5) * 30)));
    const totalBroncoSec = Number(test.broncoMin) * 60 + Number(test.broncoSec);
    const staminaRPG = Math.min(100, Math.max(10, Math.round(100 - (totalBroncoSec - 260) * 0.5)));
    const techniqueRPG = Math.min(100, Math.max(10, Math.round(100 - (Number(test.illinois) - 14.0) * 12)));

    onTestSubmit({
      force: forceRPG, speed: speedRPG, stamina: staminaRPG, technique: techniqueRPG
    });
    setShowForm(false);
  };

  return (
    <div style={{ background: 'var(--bg-dark)', padding: '20px', borderRadius: 'var(--radius-lg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-primary)' }}>Atributos Deportivos RPG</h4>
        <button onClick={() => setShowForm(!showForm)} className="btn-outline" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
          {showForm ? 'Cancelar' : '+ Registrar Test Fisico'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        {[
          { label: 'Fuerza', val: player.attributes?.force || 50, barClass: 'force' },
          { label: 'Velocidad', val: player.attributes?.speed || 50, barClass: 'speed' },
          { label: 'Resistencia', val: player.attributes?.stamina || 50, barClass: 'stamina' },
          { label: 'Tecnica / Destreza', val: player.attributes?.technique || 50, barClass: 'technique' }
        ].map(attr => (
          <div className="rpg-stat" key={attr.label}>
            <div className="rpg-stat-header">
              <span>{attr.label}</span>
              <span>{attr.val}/100</span>
            </div>
            <div className="rpg-stat-bar-container">
              <div className={`rpg-stat-bar ${attr.barClass}`} style={{ width: `${attr.val}%` }} />
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginTop: '20px', padding: '20px', background: 'rgba(0,230,118,0.02)', border: '1px dashed var(--color-primary)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <h5 style={{ fontSize: '0.9rem', color: 'var(--color-primary)', fontWeight: 800 }}>REGISTRO DE TEST CLINICO Y ATHLETIC COMBINE</h5>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              Introduce las metricas fisicas y el motor de calibracion deportiva mapeara automaticamente su rango RPG (10-100).
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '15px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--color-text)' }}>Fuerza: 1RM Sentadilla (kg)</label>
              <input type="number" min="30" max="300" value={test.squat} onChange={set('squat')} className="form-input" required />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--color-text)' }}>Fuerza: 1RM Press Banca (kg)</label>
              <input type="number" min="20" max="250" value={test.bench} onChange={set('bench')} className="form-input" required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '15px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--color-text)' }}>Velocidad: Sprint 40m (seg)</label>
              <input type="number" step="0.01" min="4.0" max="10.0" value={test.sprint} onChange={set('sprint')} className="form-input" required />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--color-text)' }}>Agilidad: Test Illinois (seg)</label>
              <input type="number" step="0.01" min="10.0" max="25.0" value={test.illinois} onChange={set('illinois')} className="form-input" required />
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--color-text)', display: 'block', marginBottom: '8px', fontWeight: 700 }}>
              Resistencia: Tiempo Test Bronco (1.2km Shuttles)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Minutos</span>
                <input type="number" min="3" max="8" value={test.broncoMin} onChange={set('broncoMin')} className="form-input" required />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Segundos</span>
                <input type="number" min="0" max="59" value={test.broncoSec} onChange={set('broncoSec')} className="form-input" required />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '5px' }}>
            <button type="button" onClick={() => setShowForm(false)} className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
              Cancelar
            </button>
            <button type="submit" className="btn-neon" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
              Calibrar RPG
            </button>
          </div>
        </form>
      )}

      <div style={{ marginTop: '20px' }}>
        <PlayerChart history={player.history || []} />
      </div>
    </div>
  );
}

export default PlayerAttributes;
