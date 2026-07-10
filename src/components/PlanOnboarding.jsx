import React, { useState } from 'react';

const GOALS = [
  { id: 'fuerza', label: 'Ganar Fuerza', icon: '💪' },
  { id: 'velocidad', label: 'Velocidad', icon: '⚡' },
  { id: 'resistencia', label: 'Resistencia', icon: '💨' },
  { id: 'perdida_grasa', label: 'Bajar Peso', icon: '⚖️' },
  { id: 'tecnica', label: 'Técnica Rugby', icon: '🏉' },
  { id: 'mixto', label: 'Mixto', icon: '🎯' },
];

const MODALITIES = [
  { id: 'gym', label: 'Gym', icon: '🏋️' },
  { id: 'campo', label: 'Campo', icon: '🏟️' },
  { id: 'casa', label: 'Casa', icon: '🏠' },
  { id: 'crossfit', label: 'CrossFit', icon: '💀' },
];

const STORES_LIST = [
  { id: 'D1', label: 'D1', icon: '🛒' },
  { id: 'Ara', label: 'Ara', icon: '🛒' },
  { id: 'Exito', label: 'Éxito', icon: '🏪' },
  { id: 'Olimpica', label: 'Olímpica', icon: '🏪' },
  { id: 'Jumbo', label: 'Jumbo', icon: '🏬' },
  { id: 'Plaza', label: 'Plaza Mercado', icon: '🥬' },
];

export default function PlanOnboarding({ onGenerate, onClose, savedPrefs }) {
  const [goal, setGoal] = useState(savedPrefs?.goal || '');
  const [modality, setModality] = useState(savedPrefs?.modality || []);
  const [stores, setStores] = useState(savedPrefs?.stores || []);
  const [dislikes, setDislikes] = useState(savedPrefs?.dislikes?.join(', ') || '');

  const toggleArray = (arr, setter, value) => {
    setter(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };

  const handleSubmit = () => {
    if (!goal) return;
    const prefs = {
      goal,
      modality: modality.length > 0 ? modality : ['gym', 'campo'],
      stores: stores.length > 0 ? stores : ['D1', 'Ara', 'Exito'],
      dislikes: dislikes.split(',').map(s => s.trim()).filter(Boolean),
    };
    onGenerate(prefs);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel animated-slide" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '12px', right: '14px', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1 }}>✕</button>
        <h3 style={{ color: 'var(--color-blue)', fontSize: '1rem', fontWeight: 700, marginBottom: '4px', fontFamily: 'Outfit' }}>
          🧠 Antes de generar tu plan...
        </h3>
        <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
          Gemini usará tus respuestas para crear un plan personalizado con ejercicios y plan de alimentación.
        </p>

        {/* Goal */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '6px', display: 'block' }}>⭐ ¿Cuál es tu meta principal?</label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {GOALS.map(g => (
              <button key={g.id} onClick={() => setGoal(g.id)}
                style={{
                  padding: '6px 12px', fontSize: '0.72rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600,
                  background: goal === g.id ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
                  color: goal === g.id ? '#000' : 'var(--color-text-muted)',
                  border: '1px solid var(--border-glass)',
                }}>{g.icon} {g.label}</button>
            ))}
          </div>
        </div>

        {/* Modality */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '6px', display: 'block' }}>🏟️ ¿Dónde entrenas?</label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {MODALITIES.map(m => (
              <button key={m.id} onClick={() => toggleArray(modality, setModality, m.id)}
                style={{
                  padding: '5px 10px', fontSize: '0.7rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  background: modality.includes(m.id) ? 'var(--color-blue)' : 'rgba(255,255,255,0.05)',
                  color: modality.includes(m.id) ? '#fff' : 'var(--color-text-muted)',
                  border: '1px solid var(--border-glass)',
                }}>{m.icon} {m.label}</button>
            ))}
          </div>
        </div>

        {/* Stores */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '6px', display: 'block' }}>🛒 ¿Dónde compras usualmente?</label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {STORES_LIST.map(s => (
              <button key={s.id} onClick={() => toggleArray(stores, setStores, s.id)}
                style={{
                  padding: '4px 8px', fontSize: '0.68rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  background: stores.includes(s.id) ? '#00e676' : 'rgba(255,255,255,0.05)',
                  color: stores.includes(s.id) ? '#000' : 'var(--color-text-muted)',
                  border: '1px solid var(--border-glass)',
                }}>{s.icon} {s.label}</button>
            ))}
          </div>
        </div>

        {/* Dislikes */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '4px', display: 'block' }}>🍗 ¿Alimentos que NO te gustan?</label>
          <input type="text" value={dislikes} onChange={e => setDislikes(e.target.value)}
            placeholder="Ej: pescado, hígado, brócoli" className="form-input"
            style={{ padding: '6px 8px', fontSize: '0.72rem', width: '100%' }} />
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-outline" style={{ padding: '8px 16px', fontSize: '0.78rem' }}>Cancelar</button>
          <button onClick={handleSubmit} disabled={!goal}
            className="btn-neon" style={{ padding: '8px 16px', fontSize: '0.78rem', opacity: goal ? 1 : 0.5 }}>
            🧠 Generar Plan con IA
          </button>
        </div>
      </div>
    </div>
  );
}
