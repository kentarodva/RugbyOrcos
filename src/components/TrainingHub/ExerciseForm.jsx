import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import ExerciseIcon, { CATEGORY_LABELS, SUBCATEGORY_LABELS } from './ExerciseIcon';

function ExerciseForm({ onCreated, onClose }) {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [playerId, setPlayerId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name_technical: '',
    name_local: '',
    category: 'gym',
    subcategory: 'fuerza_inferior',
    difficulty: 2,
    description: '',
    target_positions: 'TODOS',
    equipment: '',
  });

  const SUBCATEGORY_OPTIONS = {
    gym: ['fuerza_inferior', 'fuerza_superior', 'potencia', 'core', 'velocidad'],
    campo: ['tackle', 'pase', 'scrum', 'patada', 'evasion', 'defensa', 'resistencia', 'liderazgo'],
    recuperacion: ['movilidad'],
    prevencion: ['hombros', 'cuello', 'rodillas', 'tobillos'],
  };

  useEffect(() => {
    if (!user?.id) return;
    supabase.from('players').select('id').eq('user_id', user.id).limit(1).then(({ data }) => {
      if (data?.[0]) setPlayerId(data[0].id);
    });
  }, [user?.id]);

  const handleChange = (field, value) => {
    if (field === 'category') {
      const subs = SUBCATEGORY_OPTIONS[value] || ['general'];
      setForm(prev => ({ ...prev, category: value, subcategory: subs[0] }));
    } else {
      setForm(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSave = async () => {
    if (!form.name_technical.trim() || !form.name_local.trim()) {
      showToast('Completa los campos nombre técnico y nombre local.', 'warning');
      return;
    }
    setSaving(true);
    try {
      const code = form.name_technical.toLowerCase().replace(/[^a-záéíóúñ0-9]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
      const uniqueCode = code || 'custom_' + Date.now();
      const { data, error } = await supabase.from('exercise_catalog').insert({
        code: uniqueCode,
        name_technical: form.name_technical.trim(),
        name_local: form.name_local.trim(),
        category: form.category,
        subcategory: form.subcategory,
        difficulty: form.difficulty,
        description: form.description.trim(),
        target_positions: form.target_positions,
        equipment: form.equipment.trim(),
        is_system: false,
        created_by: playerId,
      }).select().single();
      if (error) {
        if (error.code === '23505') {
          throw new Error(`Ya existe un ejercicio con el código "${uniqueCode}". Cambia el nombre técnico.`);
        }
        throw error;
      }
      showToast('Ejercicio creado exitosamente.', 'success');
      onCreated(data);
    } catch (err) {
      showToast(err.message || 'Error al crear el ejercicio.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100 }}>
      <div className="modal-content animated-slide" style={{ maxWidth: '500px' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, fontFamily: 'Outfit' }}>✏️ Crear Ejercicio Personalizado</h3>
          <button onClick={onClose} className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="form-group">
            <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Nombre Técnico *</label>
            <input className="form-input" value={form.name_technical}
              onChange={e => handleChange('name_technical', e.target.value)}
              placeholder="Ej: Sentadilla Trasera con Barra" />
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Nombre Local (Colombia) *</label>
            <input className="form-input" value={form.name_local}
              onChange={e => handleChange('name_local', e.target.value)}
              placeholder="Ej: Sentadilla con Barra" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="form-group">
              <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Categoría</label>
              <select className="form-select"
                value={form.category} onChange={e => handleChange('category', e.target.value)}>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Subcategoría</label>
              <select className="form-select"
                value={form.subcategory} onChange={e => handleChange('subcategory', e.target.value)}>
                {(SUBCATEGORY_OPTIONS[form.category] || ['general']).map(s => (
                  <option key={s} value={s}>{SUBCATEGORY_LABELS[s] || s}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="form-group">
              <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Dificultad</label>
              <select className="form-select"
                value={form.difficulty} onChange={e => handleChange('difficulty', Number(e.target.value))}>
                {[1,2,3,4,5].map(d => (
                  <option key={d} value={d}>{'⭐'.repeat(d)} ({d}/5)</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Posiciones</label>
              <input className="form-input" value={form.target_positions}
                onChange={e => handleChange('target_positions', e.target.value)}
                placeholder="TODOS" />
            </div>
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Descripción / Drills</label>
            <textarea className="form-input" rows={3} value={form.description}
              onChange={e => handleChange('description', e.target.value)}
              placeholder="Describe el ejercicio, series, repeticiones..." style={{ resize: 'vertical' }} />
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Equipamiento</label>
            <input className="form-input" value={form.equipment}
              onChange={e => handleChange('equipment', e.target.value)}
              placeholder="Ej: barra, rack, disco" />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '14px' }}>
          <button onClick={onClose} className="btn-outline" style={{ fontSize: '0.8rem' }}>Cancelar</button>
          <button onClick={handleSave} className="btn-neon" disabled={saving}
            style={{ opacity: saving ? 0.5 : 1, fontSize: '0.8rem' }}>
            {saving ? 'Guardando...' : '💾 Guardar Ejercicio'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExerciseForm;
