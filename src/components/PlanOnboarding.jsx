import React, { useState } from 'react';

const GOALS = [
  { id: 'fuerza', label: 'Ganar Fuerza', icon: '💪' },
  { id: 'velocidad', label: 'Velocidad', icon: '⚡' },
  { id: 'resistencia', label: 'Resistencia', icon: '💨' },
  { id: 'perdida_grasa', label: 'Bajar Peso', icon: '⚖️' },
  { id: 'tecnica', label: 'Técnica Rugby', icon: '🏉' },
  { id: 'mixto', label: 'Mixto', icon: '🎯' },
];

const POSITIONS = ['Pilar','Talonador','Segunda Línea','Flanker','Octavo','Medio Melé','Apertura','Centro','Ala','Zaguero','Todas'];

const MODALITIES = [
  { id: 'gym', label: 'Gym', icon: '🏋️' },
  { id: 'campo', label: 'Campo', icon: '🏟️' },
  { id: 'casa', label: 'Casa', icon: '🏠' },
  { id: 'crossfit', label: 'CrossFit', icon: '💀' },
];

const EQUIPMENT = [
  { id: 'bodyweight', label: 'Peso Corporal', icon: '🧘' },
  { id: 'barbell', label: 'Barra', icon: '🏋️' },
  { id: 'dumbbell', label: 'Mancuernas', icon: '💪' },
  { id: 'cable', label: 'Polea', icon: '🔗' },
  { id: 'band', label: 'Bandas', icon: '🎗️' },
  { id: 'machine', label: 'Máquinas', icon: '⚙️' },
];

const DAYS = [1,2,3,4,5,6,7];
const DURATIONS = [15,30,45,60,90,120];
const SEASONS = [
  { id: 'pretemporada', label: 'Pretemporada', desc: 'Preparación física general' },
  { id: 'competencia', label: 'Competencia', desc: 'Mantenimiento + rugby específico' },
  { id: 'descanso', label: 'Descanso Activo', desc: 'Recuperación y prevención' },
];

export default function PlanOnboarding({ onGenerate, onClose, savedPrefs }) {
  const [goal, setGoal] = useState(savedPrefs?.goal || '');
  const [position, setPosition] = useState(savedPrefs?.position || '');
  const [daysPerWeek, setDaysPerWeek] = useState(savedPrefs?.daysPerWeek || 3);
  const [durationMin, setDurationMin] = useState(savedPrefs?.durationMin || 60);
  const [modality, setModality] = useState(savedPrefs?.modality || []);
  const [equipment, setEquipment] = useState(savedPrefs?.equipment || []);
  const [season, setSeason] = useState(savedPrefs?.season || '');
  const [dislikes, setDislikes] = useState(savedPrefs?.dislikes?.join(', ') || '');

  const toggleArray = (arr, setter, value) => {
    setter(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };

  const handleSubmit = () => {
    if (!goal) return;
    const prefs = {
      goal, position, daysPerWeek, durationMin,
      modality: modality.length > 0 ? modality : ['gym'],
      equipment: equipment.length > 0 ? equipment : ['bodyweight'],
      season: season || 'competencia',
      dislikes: dislikes.split(',').map(s => s.trim()).filter(Boolean),
    };
    onGenerate(prefs);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel animated-slide" onClick={e => e.stopPropagation()} style={{ maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '12px', right: '14px', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1 }}>✕</button>
        <h3 style={{ color: 'var(--color-text)', fontSize: '1rem', fontWeight: 600, marginBottom: '4px' }}>
          🧠 Personalizar Plan de Entreno
        </h3>
        <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
          La IA analizará tus respuestas y tu posición para crear un plan con ejercicios del catálogo real.
        </p>

        {/* Position */}
        <Section label="🏉 ¿Cuál es tu posición en cancha?">
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {POSITIONS.map(p => (
              <button key={p} onClick={() => setPosition(p === position ? '' : p)}
                style={{ padding: '5px 10px', fontSize: '0.7rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, background: position === p ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)', color: position === p ? '#000' : 'var(--color-text-muted)', border: '1px solid var(--border-glass)' }}>
                {p}
              </button>
            ))}
          </div>
        </Section>

        {/* Goal + Season */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '10px' }}>
          <Section label="⭐ Meta principal">
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {GOALS.map(g => (
                <button key={g.id} onClick={() => setGoal(g.id)}
                  style={{ padding: '5px 9px', fontSize: '0.68rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, background: goal === g.id ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)', color: goal === g.id ? '#000' : 'var(--color-text-muted)', border: '1px solid var(--border-glass)' }}>
                  {g.icon} {g.label}
                </button>
              ))}
            </div>
          </Section>
          <Section label="📅 Momento de temporada">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {SEASONS.map(s => (
                <button key={s.id} onClick={() => setSeason(s.id)}
                  style={{ padding: '5px 10px', fontSize: '0.68rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, textAlign: 'left', background: season === s.id ? 'var(--color-blue)' : 'rgba(255,255,255,0.05)', color: season === s.id ? '#fff' : 'var(--color-text-muted)', border: '1px solid var(--border-glass)' }}>
                  {s.label} <span style={{ fontSize: '0.6rem', opacity: 0.7 }}>— {s.desc}</span>
                </button>
              ))}
            </div>
          </Section>
        </div>

        {/* Days + Duration */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '10px' }}>
          <Section label="📅 Días por semana">
            <select value={daysPerWeek} onChange={e => setDaysPerWeek(Number(e.target.value))} className="form-select" style={{ padding: '6px 8px', fontSize: '0.72rem' }}>
              {DAYS.map(d => <option key={d} value={d}>{d} día{d !== 1 ? 's' : ''}</option>)}
            </select>
          </Section>
          <Section label="⏱️ Minutos por sesión">
            <select value={durationMin} onChange={e => setDurationMin(Number(e.target.value))} className="form-select" style={{ padding: '6px 8px', fontSize: '0.72rem' }}>
              {DURATIONS.map(d => <option key={d} value={d}>{d} min</option>)}
            </select>
          </Section>
        </div>

        {/* Modality */}
        <Section label="🏟️ ¿Dónde entrenas?">
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {MODALITIES.map(m => (
              <button key={m.id} onClick={() => toggleArray(modality, setModality, m.id)}
                style={{ padding: '5px 10px', fontSize: '0.7rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, background: modality.includes(m.id) ? 'var(--color-blue)' : 'rgba(255,255,255,0.05)', color: modality.includes(m.id) ? '#fff' : 'var(--color-text-muted)', border: '1px solid var(--border-glass)' }}>
                {m.icon} {m.label}
              </button>
            ))}
          </div>
        </Section>

        {/* Equipment */}
        <Section label="🔧 ¿Qué equipo tienes disponible?">
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {EQUIPMENT.map(eq => (
              <button key={eq.id} onClick={() => toggleArray(equipment, setEquipment, eq.id)}
                style={{ padding: '5px 10px', fontSize: '0.7rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, background: equipment.includes(eq.id) ? '#22c55e' : 'rgba(255,255,255,0.05)', color: equipment.includes(eq.id) ? '#000' : 'var(--color-text-muted)', border: '1px solid var(--border-glass)' }}>
                {eq.icon} {eq.label}
              </button>
            ))}
          </div>
        </Section>

        {/* Dislikes */}
        <div style={{ marginBottom: '10px' }}>
          <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '4px', display: 'block' }}>🚫 Ejercicios o alimentos que NO te gustan</label>
          <input type="text" value={dislikes} onChange={e => setDislikes(e.target.value)}
            placeholder="Ej: fondos, pescado, brócoli" className="form-input"
            style={{ padding: '6px 8px', fontSize: '0.72rem', width: '100%' }} />
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
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

function Section({ label, children }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '5px', display: 'block' }}>{label}</label>
      {children}
    </div>
  );
}
