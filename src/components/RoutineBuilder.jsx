import React, { useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';
import { ClubContext } from '../context/ClubContext';
import { useToast } from '../context/ToastContext';
import { persistPlan } from '../engine/trainingPlanService';
import { CATEGORY_LABELS, SUBCATEGORY_LABELS } from './TrainingHub/ExerciseIcon';

export default function RoutineBuilder({ player, existingPlan, onSaved, onClose }) {
  const { activeTeamId } = useContext(ClubContext);
  const { showToast } = useToast();

  const [exercises, setExercises] = useState([]);
  const [plan, setPlan] = useState({
    calentamiento: existingPlan?.plan?.calentamiento || [],
    campo: existingPlan?.plan?.campo || [],
    gym: existingPlan?.plan?.gym || [],
    crossfit: existingPlan?.plan?.crossfit || [],
    casa: existingPlan?.plan?.casa || [],
    recuperacion: existingPlan?.plan?.recuperacion || [],
    prevencion: existingPlan?.plan?.prevencion || [],
  });
  const [activeCategory, setActiveCategory] = useState('calentamiento');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('exercise_catalog').select('*').order('category').order('difficulty')
      .then(({ data }) => { if (data) setExercises(data); })
      .catch(() => {});
  }, []);

  const filtered = exercises.filter(e => {
    if (e.category !== activeCategory) return false;
    if (search && !e.name_local.toLowerCase().includes(search.toLowerCase()) && !e.name_technical.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const grouped = {};
  filtered.forEach(e => {
    const sub = e.subcategory || 'general';
    if (!grouped[sub]) grouped[sub] = [];
    grouped[sub].push(e);
  });

  const addExercise = (ex) => {
    const entry = { code: ex.code, name: ex.name_local || ex.name_technical, category: ex.category, subcategory: ex.subcategory, difficulty: ex.difficulty, equipment: ex.equipment, description: ex.description, fromCustom: true };
    setPlan(prev => ({ ...prev, [activeCategory]: [...prev[activeCategory], entry] }));
  };

  const removeExercise = (category, index) => {
    setPlan(prev => ({ ...prev, [category]: prev[category].filter((_, i) => i !== index) }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await persistPlan(player.id, { plan }, 'custom');
      showToast('¡Rutina guardada!', 'success');
      onSaved?.();
    } catch {
      showToast('Error al guardar la rutina.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const totalExercises = Object.values(plan).reduce((s, arr) => s + arr.length, 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel animated-slide" onClick={e => e.stopPropagation()} style={{ maxWidth: '720px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '12px', right: '14px', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1 }}>✕</button>
        <h3 style={{ color: 'var(--color-blue)', fontSize: '1rem', fontWeight: 700, marginBottom: '12px', fontFamily: 'Outfit' }}>
          {existingPlan ? 'Modificar Plan' : 'Crear Plan'} — {player.name}
        </h3>

        {/* Category tabs */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
          {Object.keys(plan).map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              style={{
                padding: '5px 10px', fontSize: '0.7rem', fontWeight: 700, borderRadius: 'var(--radius-sm)',
                background: activeCategory === cat ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
                color: activeCategory === cat ? '#000' : 'var(--color-text-muted)',
                border: '1px solid var(--border-glass)', cursor: 'pointer',
              }}>
              {CATEGORY_LABELS[cat] || cat} ({plan[cat].length})
            </button>
          ))}
        </div>

        {/* My plan summary */}
        {plan[activeCategory].length > 0 && (
          <div style={{ marginBottom: '10px', padding: '8px', background: 'rgba(0,230,118,0.05)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem' }}>
            <span style={{ color: '#00e676', fontWeight: 700 }}>Agregados:</span>
            {plan[activeCategory].map((ex, i) => (
              <span key={i} style={{ marginLeft: '6px', color: 'var(--color-text)', display: 'inline-block' }}>
                {ex.name}
                <button onClick={() => removeExercise(activeCategory, i)} style={{ marginLeft: '4px', background: 'none', border: 'none', color: '#ff5252', cursor: 'pointer', fontSize: '0.7rem', padding: 0, lineHeight: 1 }}>✕</button>
                {i < plan[activeCategory].length - 1 ? ', ' : ''}
              </span>
            ))}
          </div>
        )}

        {/* Search */}
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar ejercicio..." className="form-input"
          style={{ padding: '6px 10px', fontSize: '0.75rem', marginBottom: '10px' }} />

        {/* Exercise list */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {Object.keys(grouped).length === 0 && (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', textAlign: 'center', padding: '20px' }}>
              No hay ejercicios en {CATEGORY_LABELS[activeCategory] || activeCategory} con ese filtro.
            </p>
          )}
          {Object.entries(grouped).map(([sub, exs]) => (
            <div key={sub}>
              <h4 style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                {SUBCATEGORY_LABELS[sub] || sub}
              </h4>
              {exs.map(ex => {
                const added = plan[activeCategory].some(p => p.code === ex.code);
                return (
                  <div key={ex.code} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', marginBottom: '3px', fontSize: '0.75rem', opacity: added ? 0.5 : 1 }}>
                    <div>
                      <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{ex.name_local}</span>
                      <span style={{ color: 'var(--color-text-muted)', marginLeft: '6px', fontSize: '0.65rem' }}>{ex.name_technical}</span>
                      {ex.equipment && <span style={{ color: 'var(--color-text-muted)', marginLeft: '6px', fontSize: '0.6rem' }}>🎒 {ex.equipment}</span>}
                      <span style={{ marginLeft: '6px', fontSize: '0.6rem', color: 'var(--color-gold)' }}>{'⭐'.repeat(ex.difficulty)}</span>
                    </div>
                    <button onClick={() => addExercise(ex)} disabled={added}
                      style={{ padding: '2px 8px', fontSize: '0.65rem', borderRadius: 'var(--radius-sm)', background: added ? 'transparent' : 'var(--color-primary)', color: added ? 'var(--color-text-muted)' : '#000', border: 'none', cursor: added ? 'default' : 'pointer', fontWeight: 700 }}>
                      {added ? '✓' : '+'}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{totalExercises} ejercicios en el plan</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onClose} className="btn-outline" style={{ padding: '6px 14px', fontSize: '0.75rem' }}>Cancelar</button>
            <button onClick={handleSave} disabled={saving || totalExercises === 0} className="btn-neon"
              style={{ padding: '6px 14px', fontSize: '0.75rem', justifyContent: 'center', opacity: totalExercises === 0 ? 0.5 : 1 }}>
              {saving ? 'Guardando...' : '💾 Guardar Plan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
