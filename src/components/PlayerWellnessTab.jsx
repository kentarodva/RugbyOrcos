import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';

function PlayerWellnessTab({ player, recordWellness }) {
  const { showToast } = useToast();
  const [wellness, setWellness] = useState({ sleep: 3, soreness: 3, stress: 3 });
  const lastWellness = (player.wellnessLogs || []).slice(-1)[0];

  const handleWellnessSubmit = () => {
    recordWellness(player.id, { date: new Date().toISOString().split('T')[0], ...wellness });
    showToast('Wellness registrado, Guerrero.', 'success');
  };

  return (
    <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
      <h3 style={{ color: 'var(--color-gold)', fontSize: '1rem', fontWeight: 700, marginBottom: '12px', fontFamily: 'Outfit' }}>
        Wellness Check-in
      </h3>
      {lastWellness && (
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '15px' }}>
          Ultimo registro: {lastWellness.date} — Sueño: {'⭐'.repeat(lastWellness.sleep || 0)} Dolor: {'⭐'.repeat(lastWellness.soreness || 0)} Estres: {'⭐'.repeat(lastWellness.stress || 0)}
        </p>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '15px' }}>
        {[
          { key: 'sleep', label: 'Sueño' },
          { key: 'soreness', label: 'Dolor Muscular' },
          { key: 'stress', label: 'Estrés' },
        ].map(w => (
          <div key={w.key} style={{ textAlign: 'center' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '6px' }}>{w.label}</label>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setWellness({...wellness, [w.key]: n})}
                  style={{
                    width: '28px', height: '28px', borderRadius: '50%', border: '1px solid',
                    borderColor: wellness[w.key] >= n ? 'var(--color-gold)' : 'var(--border-glass)',
                    background: wellness[w.key] >= n ? 'rgba(255,179,0,0.15)' : 'transparent',
                    color: wellness[w.key] >= n ? 'var(--color-gold)' : 'var(--color-text-muted)',
                    cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700
                  }}>{n}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button onClick={handleWellnessSubmit} className="btn-neon"
        style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '0.85rem' }}>
        Registrar Wellness
      </button>
    </div>
  );
}

export default PlayerWellnessTab;
